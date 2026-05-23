import { Injectable } from '@nestjs/common';
import {
  AiReportContextService,
  findRow,
  formatMoney,
  getQuarterPeriods,
  sumRowValues,
} from './ai-report-context.service';
import { AiGeminiService } from './ai-gemini.service';
import { parseQueryResponse } from './ai-response-parser';
import type { AiQueryAnswer, AiReportContext } from './ai.types';

@Injectable()
export class AiQuestionService {
  constructor(
    private readonly geminiService: AiGeminiService,
    private readonly reportContextService: AiReportContextService,
  ) {}

  async answer(
    context: AiReportContext,
    question: string,
  ): Promise<AiQueryAnswer> {
    const fallbackAnswer = buildFallbackAnswer(context, question);

    if (!this.geminiService.hasApiKey()) {
      return {
        ...fallbackAnswer,
        generatedAt: new Date().toISOString(),
        model: null,
        status: 'fallback',
      };
    }

    try {
      const text = await this.geminiService.generateText(
        this.buildPrompt(context, question),
      );
      const generated = parseQueryResponse(text ?? undefined, question);

      return {
        ...generated,
        generatedAt: new Date().toISOString(),
        model: this.geminiService.getConfiguredModel(),
        status: 'generated',
      };
    } catch {
      return {
        ...fallbackAnswer,
        generatedAt: new Date().toISOString(),
        model: this.geminiService.getConfiguredModel(),
        status: 'fallback',
      };
    }
  }

  private buildPrompt(context: AiReportContext, question: string) {
    return `Answer a natural-language question about an integrated P&L report.
Return only valid JSON with this exact shape:
{
  "answer": "clear concise answer grounded in the snapshot",
  "evidence": [
    { "rowLabel": "row", "periodLabel": "period", "value": 123 }
  ]
}

Rules:
- Do not invent rows, periods, or values.
- If the question cannot be answered from the snapshot, say so clearly.
- If a question asks for a total over multiple periods, calculate and state the total.
- If the user says "gross profit", use Gross Profit.
- If the user says "net income", use Net Income.
- If the user says "total profit" or ambiguous "profit", use Gross Profit unless they explicitly say net income.
- Keep the answer short and cite the exact rows/periods used in evidence.

Question: ${question}
Snapshot:
${JSON.stringify(this.reportContextService.buildSnapshot(context))}`;
  }
}

function buildFallbackAnswer(
  context: AiReportContext,
  question: string,
): Omit<AiQueryAnswer, 'generatedAt' | 'model' | 'status'> {
  const row = findQuestionRow(context, question);
  const quarter = findQuarter(question);

  if (!row) {
    return {
      answer:
        'I could not match that question to a known report row. Try asking about income, expenses, gross profit, net operating income, or net income.',
      evidence: [],
      question,
    };
  }

  const periods = quarter
    ? getQuarterPeriods(context.report.periods, quarter)
    : context.periods;
  const scopedPeriods = periods.filter(
    (period) => row.values[period.id] !== undefined,
  );

  if (scopedPeriods.length === 0) {
    return {
      answer: `${row.label} has no available values for that period range.`,
      evidence: [],
      question,
    };
  }

  const total = sumRowValues(row, scopedPeriods);
  const periodLabel = quarter
    ? `Q${quarter}`
    : `${scopedPeriods[0]?.label} - ${scopedPeriods.at(-1)?.label}`;

  return {
    answer: `${row.label} for ${periodLabel} was ${formatMoney(total, context.report.currency)}.`,
    evidence: scopedPeriods.map((period) => ({
      periodLabel: period.label,
      rowLabel: row.label,
      value: row.values[period.id] ?? 0,
    })),
    question,
  };
}

function findQuestionRow(context: AiReportContext, question: string) {
  const normalized = question.toLowerCase();

  if (
    normalized.includes('gross profit') ||
    normalized.includes('total profit')
  ) {
    return findRow(context.rows, 'Gross Profit');
  }

  if (normalized.includes('net operating')) {
    return findRow(context.rows, 'Net Operating Income');
  }

  if (normalized.includes('net income') || normalized.includes('profit')) {
    return findRow(context.rows, 'Net Income');
  }

  if (normalized.includes('expense')) {
    return (
      findRow(context.rows, 'Expenses') ??
      findRow(context.rows, 'Operating Expenses')
    );
  }

  if (normalized.includes('revenue') || normalized.includes('income')) {
    return findRow(context.rows, 'Income') ?? findRow(context.rows, 'Revenue');
  }

  return null;
}

function findQuarter(question: string) {
  const match = /\bq([1-4])\b/i.exec(question);

  return match ? Number(match[1]) : null;
}
