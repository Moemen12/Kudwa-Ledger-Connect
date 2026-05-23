import { Module } from '@nestjs/common';
import { LedgerModule } from '../ledger/ledger.module';
import { AiController } from './ai.controller';
import { AiGeminiService } from './ai-gemini.service';
import { AiInsightsService } from './ai-insights.service';
import { AiQueryGuardService } from './ai-query-guard.service';
import { AiQuestionService } from './ai-question.service';
import { AiReportContextService } from './ai-report-context.service';
import { AiService } from './ai.service';

@Module({
  controllers: [AiController],
  imports: [LedgerModule],
  providers: [
    AiGeminiService,
    AiInsightsService,
    AiQueryGuardService,
    AiQuestionService,
    AiReportContextService,
    AiService,
  ],
})
export class AiModule {}
