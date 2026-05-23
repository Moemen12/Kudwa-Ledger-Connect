import { Injectable } from '@nestjs/common';
import type { ProfitAndLossRow } from '../ledger/ledger.types';
import { normalizeLabel } from './ai-report-context.service';
import {
  REPORT_INTENT_KEYWORDS,
  REPORT_SUBJECT_KEYWORDS,
} from './ai-query-intent';

@Injectable()
export class AiQueryGuardService {
  isActionableReportQuestion(question: string, rows: ProfitAndLossRow[]) {
    const normalizedQuestion = normalizeLabel(question);
    const subjectMatches =
      REPORT_SUBJECT_KEYWORDS.some((keyword) =>
        normalizedQuestion.includes(keyword),
      ) ||
      rows.some((row) => {
        const normalizedLabel = normalizeLabel(row.label);

        return (
          normalizedLabel.length > 2 &&
          normalizedQuestion.includes(normalizedLabel)
        );
      });
    const intentMatches = REPORT_INTENT_KEYWORDS.some((keyword) =>
      normalizedQuestion.includes(keyword),
    );

    return subjectMatches && intentMatches;
  }

  getClarifyingQuestionAnswer(question: string) {
    return {
      answer:
        'Could you ask a clearer question about the profit-and-loss report? Try including a metric and a period, for example: “What was income in Q1?” or “Compare expenses by month.”',
      evidence: [],
      generatedAt: new Date().toISOString(),
      model: null,
      question,
      status: 'unavailable' as const,
    };
  }
}
