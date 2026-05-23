# Kudwa Ledger Connect

Kudwa Ledger Connect is a full-stack financial data integration project. The app ingests two JSON profit-and-loss data sources that describe the same business reporting domain in different shapes, normalizes them into a single backend schema, stores the integrated result in SQLite, and displays it as an interactive P&L dashboard.

The intended product experience is deliberately focused: one backend integration flow, one unified data API, dashboard KPI cards with dynamic charts, one P&L table with nested expandable rows, and one AI-assisted feature that helps a user understand the financial report instead of merely viewing raw numbers.

## Project Brief

The exercise tests judgment across four areas:

- **Data integration quality:** reconcile two differently shaped JSON sources into one clean schema that can represent reporting periods, line items, hierarchy, dimensions, and amounts without leaking source-specific structure into the rest of the app.
- **Backend design:** use NestJS to expose a small API surface for triggering integration and fetching the unified report. The backend should keep ETL, persistence, business rules, and transport concerns separated.
- **Frontend clarity:** use React to present the integrated P&L as a responsive, nested table with expandable rows and a clear control for triggering or refreshing integration.
- **AI usefulness:** add one grounded AI feature, such as natural-language querying, automated insights, or anomaly detection, that explains the integrated financial data in plain language.

## Local Setup

To run the project locally, install dependencies and start both the backend and frontend from the repository root.

1. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

2. Start the backend API

```bash
cd server
npm run start:dev
```

The backend runs on `http://localhost:3000` by default.

3. Start the frontend dashboard

```bash
cd client
npm run dev
```

The frontend runs on `http://localhost:5173` by default.

4. AI configuration (optional)

Create a `.env` file in `server/` or set environment variables before starting the backend.

```bash
GEMINI_API_KEY=your_google_ai_studio_key
GEMINI_MODEL=gemini-2.5-flash
```

If no key is configured, the AI endpoints will still return deterministic fallback insights for local development.

## What Is Built So Far

- **Backend:** NestJS (NODE JS Framework built on top of express) API with a ledger feature, SQLite persistence through Drizzle, ETL transformation for both provided JSON files, typed application errors, and consistent API response envelopes.
- **Database:** A normalized SQLite schema for integration runs, source imports, canonical report periods, nested report rows, period values, and source row mappings.
- **API:** `POST /api/ledger/integrations` triggers ETL and writes the unified report. `GET /api/ledger/report` returns the latest unified report.
- **Frontend:** React 19 + Vite + TypeScript + Tailwind + shadcn-style UI primitives. The dashboard loads the report with Suspense, shows KPI cards with Recharts/shadcn chart primitives, and renders a nested expandable P&L table.
- **AI:** `POST /api/ai/ledger/insights` generates grounded financial observations and `POST /api/ai/ledger/query` answers natural-language report questions using Google GenAI when configured, with deterministic fallback output for local development.
- **Boundaries:** Client and server both have ESLint import boundary rules. Client feature modules expose a public `index.ts` so presentation imports from `@/features/ledger` instead of private feature files.

## Architecture Direction

This repository uses a hybrid clean architecture and feature-first structure.

The backend keeps NestJS modules thin at the transport boundary. Controllers receive HTTP requests, validate input, call feature services, and return safe response DTOs. Feature services own business rules and orchestration. Repositories own persistence and mapping to the database. Infrastructure adapters own external concerns such as database clients, configuration, queues, cache, and third-party AI providers.

The frontend keeps the React app shell thin. App-level files compose providers and top-level screens. Feature modules own domain types, schemas, API functions, and small client-side model helpers. Presentation modules own UI components and hooks. UI components stay mostly presentational, with orchestration pushed into hooks or feature helpers.

The client intentionally does not mirror backend repository/service naming. The frontend ledger feature currently uses:

- `ledger.api.ts` for HTTP calls.
- `ledger.service.ts` for frontend ledger use-cases such as fetching the report and refreshing integration.
- `ledger.model.ts` for pure client-side report helpers such as visible rows and KPI derivation.
- `ledger.schemas.ts` for Zod validation of API payloads.
- `ledger.types.ts` for shared ledger UI/domain types.
- `index.ts` as the public feature surface.

## Backend Flow

1. Extract both required JSON files from `server/data/raw`.
2. Parse and validate the obvious source-shape requirements.
3. Transform both source shapes into a canonical P&L model.
4. Load normalized entities into SQLite through the ledger repository.
5. Serve the latest unified report through a stable API response shape.
6. Later, run the AI feature only against normalized, grounded report data.

## Schema Design

The backend uses SQLite with Drizzle table definitions in `server/src/infrastructure/database/drizzle/schema` and an append-only SQL migration in `server/src/infrastructure/database/drizzle/migrations`.

The unified schema is intentionally normalized:

- `integration_runs` stores each ETL execution and report-level metadata.
- `source_imports` stores source metadata for each run, including file name, source system, imported row count, imported period count, report range, and currency.
- `report_periods` stores the canonical month/period axis shared by both sources.
- `report_rows` stores nested P&L rows with `parent_row_id`, `depth`, `kind`, and `sort_order` so the frontend can render expandable hierarchy without knowing either source format.
- `report_values` stores numeric amounts by `(run_id, row_id, period_id)`, which keeps the schema flexible as the number of periods changes.
- `source_row_mappings` preserves traceability from normalized report rows back to source-specific IDs/groups.

### Why this design

- The schema separates ETL runs from the normalized report data so the backend can support fresh reimports and retain run metadata without coupling the UI to the raw sources.
- Canonical `report_periods` avoids source-specific period labels and makes it easy to render consistent month comparisons across both data files.
- Nesting hierarchy in `report_rows` keeps the frontend simple: it can expand and collapse rows based on parent/child relationships without needing embedded source logic.
- Storing values in `report_values` instead of wide row objects makes the schema resilient to a changing period axis and keeps the data model aligned with analytics scenarios.
- `source_row_mappings` preserves auditability, so the normalized report remains grounded in the original JSON inputs while keeping the app-facing API clean.

This keeps the UI and AI feature independent from the quirks of either source file while still allowing debugging and auditability.

## Why We Need SQLite If We Have SQL

The `.sql` migration file is only the instruction for creating the database structure. It is not the database itself.

SQLite is the actual database file that stores integrated report data after ETL runs. In this project, the migration SQL creates tables such as `report_rows` and `report_values`; then the integration endpoint reads the JSON files, transforms them, and inserts rows into the SQLite database.

So the roles are different:

- **SQL migration:** describes the schema and can recreate the tables.
- **SQLite database file:** stores the current integrated report data locally.
- **Drizzle schema:** gives TypeScript-aware table/query definitions in code.
- **ETL:** fills the database with normalized data from both JSON sources.

Without the database, every request would need to reread and retransform both JSON files. Persisting the normalized report makes the API closer to a real integration product: ETL writes canonical data once, then the frontend and AI feature read from the unified schema.

## Frontend Dashboard

The React UI currently renders:

- A header with integration control and status feedback.
- KPI cards derived dynamically from available report rows. If a preferred metric is missing, the feature model falls back to another meaningful financial row with data instead of showing empty charts.
- Recharts-powered shadcn-style chart cards.
- A nested expandable P&L table.
- A “See More Months” control that reveals hidden months without requiring another fetch.
- A full-page skeleton fallback for the initial Suspense report load.
- An AI panel with explicit “Generate insights” and natural-language “Ask question” actions. It does not call the model automatically on page load.

## AI Setup

The AI integration lives in its own NestJS `AiModule`, not inside the ledger module and not in the browser. This keeps the Google API key out of the client bundle and keeps the ledger feature focused on integration/report data.

The server loads `.env` through Nest's `ConfigModule` and validates environment variables at startup. Request bodies are validated with DTO classes and the global Nest `ValidationPipe`.

Natural-language report questions are guarded before calling Gemini. The client and server both check for finance/report keywords plus normalized account labels from the integrated report, so inputs like `hello` are rejected locally and never spend an AI call.

Set these environment variables before running the server:


```bash
GEMINI_API_KEY=your_google_ai_studio_key
```

```bash
GEMINI_MODEL=gemini-2.5-flash
```

If no key is configured, the AI endpoints still return useful deterministic output computed from the normalized report. That fallback makes the app easy to run locally while keeping the product flow intact.

## Current Status

The repository is being prepared from framework starter projects into a production-ready shape:

- `client/` contains the React dashboard application.
- `server/` contains the NestJS API.
- Architecture boundaries are enforced with ESLint import restrictions.
- Product-specific ETL and the unified SQLite schema live in the backend ledger feature and infrastructure database module.
- Two AI features are implemented: grounded automated insights and natural-language report Q&A.

## What I'd Do Differently With More Time

- Add a richer migration workflow around generated Drizzle snapshots and automated schema versioning.
- Build deeper source-specific validation and stronger error reporting for each raw JSON shape before ETL begins.
- Add API contract tests around integration and report endpoints, including snapshot coverage for the unified response schema.
- Improve visual grouping in the P&L table so it more closely resembles a finance workbook, with subtotals, section headers, and better row styling.
- Add richer natural-language query parsing for multi-period comparisons, aliased row names, and category-level reasoning.
- Consider lazy-loading Recharts or splitting the dashboard bundle if frontend performance becomes a concern.
- Expose run history in the API so the UI can show multiple integration snapshots instead of only the latest report.
