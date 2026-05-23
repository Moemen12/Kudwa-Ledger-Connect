import { Injectable } from '@nestjs/common';
import type { ProfitAndLossRow } from '../ledger/ledger.types';
import {
  AiReportContextService,
  findRow,
  formatMoney,
  getLargestAbsoluteValue,
  getLatestValue,
} from './ai-report-context.service';
import { AiGeminiService } from './ai-gemini.service';
import { parseInsightsResponse } from './ai-response-parser';
import type { AiInsight, AiInsightsResult, AiReportContext } from './ai.types';

@Injectable()
export class AiInsightsService {
  constructor(
    private readonly geminiService: AiGeminiService,
    private readonly reportContextService: AiReportContextService,
  ) {}

  async generate(context: AiReportContext): Promise<AiInsightsResult> {
    const fallbackInsights = buildFallbackInsights(context);

    if (!this.geminiService.hasApiKey()) {
      return buildInsightResult('fallback', null, fallbackInsights);
    }

    try {
      const text = await this.geminiService.generateText(
        this.buildPrompt(context),
      );
      const insights = parseInsightsResponse(text ?? undefined);

      return buildInsightResult(
        'generated',
        this.geminiService.getConfiguredModel(),
        insights.length > 0 ? insights : fallbackInsights,
      );
    } catch {
      return buildInsightResult(
        'fallback',
        this.geminiService.getConfiguredModel(),
        fallbackInsights,
      );
    }
  }

  private buildPrompt(context: AiReportContext) {
    return `You are analyzing an integrated profit-and-loss report.
Return only valid JSON with this exact shape:
{
  "insights": [
    {
      "title": "short title",
      "body": "one concise sentence grounded in the provided numbers",
      "severity": "info" | "positive" | "warning",
      "evidence": { "rowLabel": "row", "periodLabel": "period", "value": 123 }
    }
  ]
}

Rules:
- Produce 3 insights.
- Do not invent numbers.
- Use only rows and period values in this snapshot.
- Prefer concrete financial observations over generic commentary.

Snapshot:
${JSON.stringify(this.reportContextService.buildSnapshot(context))}`;
  }
}

export function buildUnavailableInsights(): AiInsightsResult {
  return {
    generatedAt: new Date().toISOString(),
    insights: [
      {
        body: 'Run integration before generating AI insights.',
        evidence: {},
        severity: 'info',
        title: 'No integrated report yet',
      },
    ],
    model: null,
    status: 'unavailable',
  };
}

function buildInsightResult(
  status: AiInsightsResult['status'],
  model: string | null,
  insights: AiInsight[],
): AiInsightsResult {
  return {
    generatedAt: new Date().toISOString(),
    insights,
    model,
    status,
  };
}

function buildFallbackInsights(context: AiReportContext): AiInsight[] {
  const insights: AiInsight[] = [];
  const netIncome = findRow(context.rows, 'Net Income');
  const income =
    findRow(context.rows, 'Income') ?? findRow(context.rows, 'Revenue');
  const expenses =
    findRow(context.rows, 'Expenses') ??
    findRow(context.rows, 'Operating Expenses');

  if (netIncome) {
    const latest = getLatestValue(netIncome, context.periods);

    if (latest) {
      insights.push({
        body: `Net income was ${formatMoney(latest.value, context.report.currency)} in ${latest.period.label}.`,
        evidence: {
          periodLabel: latest.period.label,
          rowLabel: netIncome.label,
          value: latest.value,
        },
        severity: latest.value >= 0 ? 'positive' : 'warning',
        title:
          latest.value >= 0
            ? 'Net income is positive'
            : 'Net income is negative',
      });
    }
  }

  addPeakInsight(
    insights,
    income,
    context,
    'Income peak identified',
    'positive',
  );
  addPeakInsight(insights, expenses, context, 'Expense pressure', 'warning');

  return insights.slice(0, 3);
}

function addPeakInsight(
  insights: AiInsight[],
  row: ProfitAndLossRow | undefined,
  context: AiReportContext,
  title: string,
  severity: AiInsight['severity'],
) {
  if (!row) {
    return;
  }

  const strongest = getLargestAbsoluteValue(row, context.periods);

  if (!strongest) {
    return;
  }

  insights.push({
    body: `${row.label} reached ${formatMoney(strongest.value, context.report.currency)} in ${strongest.period.label}.`,
    evidence: {
      periodLabel: strongest.period.label,
      rowLabel: row.label,
      value: strongest.value,
    },
    severity,
    title,
  });
}
