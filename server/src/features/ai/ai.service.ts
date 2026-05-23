import { Injectable } from '@nestjs/common';
import { LedgerService } from '../ledger/ledger.service';
import type { UnifiedProfitAndLossReport } from '../ledger/ledger.types';
import {
  AiInsightsService,
  buildUnavailableInsights,
} from './ai-insights.service';
import { AiQueryGuardService } from './ai-query-guard.service';
import { AiQuestionService } from './ai-question.service';
import { AiReportContextService } from './ai-report-context.service';
import type { AiInsightsResult, AiQueryAnswer } from './ai.types';

@Injectable()
export class AiService {
  constructor(
    private readonly insightsService: AiInsightsService,
    private readonly ledgerService: LedgerService,
    private readonly queryGuard: AiQueryGuardService,
    private readonly questionService: AiQuestionService,
    private readonly reportContextService: AiReportContextService,
  ) {}

  async generateLedgerInsights(): Promise<AiInsightsResult> {
    const report: UnifiedProfitAndLossReport =
      this.ledgerService.getLatestReport();

    if (report.status !== 'integrated' || report.rows.length === 0) {
      return buildUnavailableInsights();
    }

    return this.insightsService.generate(
      this.reportContextService.build(report),
    );
  }

  async answerLedgerQuestion(question: string): Promise<AiQueryAnswer> {
    const report: UnifiedProfitAndLossReport =
      this.ledgerService.getLatestReport();

    if (!this.queryGuard.isActionableReportQuestion(question, report.rows)) {
      return this.queryGuard.getClarifyingQuestionAnswer(question);
    }

    if (report.status !== 'integrated' || report.rows.length === 0) {
      return {
        answer: 'Run integration before asking questions about the report.',
        evidence: [],
        generatedAt: new Date().toISOString(),
        model: null,
        question,
        status: 'unavailable',
      };
    }

    return this.questionService.answer(
      this.reportContextService.build(report),
      question,
    );
  }
}
