import { relations } from 'drizzle-orm';
import {
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';

export const integrationRuns = sqliteTable('integration_runs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  status: text('status', { enum: ['empty', 'integrated', 'failed'] }).notNull(),
  generatedAt: text('generated_at'),
  currency: text('currency').notNull(),
  createdAt: text('created_at').notNull(),
});

export const sourceImports = sqliteTable(
  'source_imports',
  {
    runId: text('run_id')
      .notNull()
      .references(() => integrationRuns.id, { onDelete: 'cascade' }),

    sourceId: text('source_id').notNull(),

    fileName: text('file_name').notNull(),

    system: text('system', {
      enum: ['quickbooks-report', 'rootfi-periods'],
    }).notNull(),

    reportName: text('report_name').notNull(),

    periodStart: text('period_start'),
    periodEnd: text('period_end'),

    currency: text('currency').notNull(),

    rowsImported: integer('rows_imported').notNull(),
    periodsImported: integer('periods_imported').notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.runId, table.sourceId],
    }),
  ],
);

export const reportPeriods = sqliteTable(
  'report_periods',
  {
    runId: text('run_id')
      .notNull()
      .references(() => integrationRuns.id, { onDelete: 'cascade' }),

    periodId: text('period_id').notNull(),

    label: text('label').notNull(),

    startsOn: text('starts_on').notNull(),
    endsOn: text('ends_on').notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.runId, table.periodId],
    }),
  ],
);

export const reportRows = sqliteTable(
  'report_rows',
  {
    runId: text('run_id')
      .notNull()
      .references(() => integrationRuns.id, { onDelete: 'cascade' }),

    rowId: text('row_id').notNull(),

    sourceId: text('source_id').notNull(),

    parentRowId: text('parent_row_id'),

    label: text('label').notNull(),

    kind: text('kind', {
      enum: ['section', 'account', 'metric'],
    }).notNull(),

    depth: integer('depth').notNull(),

    sortOrder: integer('sort_order').notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.runId, table.rowId],
    }),
  ],
);

export const reportValues = sqliteTable(
  'report_values',
  {
    runId: text('run_id')
      .notNull()
      .references(() => integrationRuns.id, { onDelete: 'cascade' }),

    rowId: text('row_id').notNull(),

    periodId: text('period_id').notNull(),

    value: real('value').notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.runId, table.rowId, table.periodId],
    }),
  ],
);

export const sourceRowMappings = sqliteTable(
  'source_row_mappings',
  {
    runId: text('run_id')
      .notNull()
      .references(() => integrationRuns.id, { onDelete: 'cascade' }),

    rowId: text('row_id').notNull(),

    sourceId: text('source_id').notNull(),

    externalId: text('external_id'),

    sourceGroup: text('source_group'),
  },
  (table) => [
    primaryKey({
      columns: [table.runId, table.rowId],
    }),
  ],
);

export const integrationRunsRelations = relations(
  integrationRuns,
  ({ many }) => ({
    sources: many(sourceImports),
    periods: many(reportPeriods),
    rows: many(reportRows),
    values: many(reportValues),
    mappings: many(sourceRowMappings),
  }),
);

export const reportRowsRelations = relations(reportRows, ({ many }) => ({
  values: many(reportValues),
  mappings: many(sourceRowMappings),
}));
