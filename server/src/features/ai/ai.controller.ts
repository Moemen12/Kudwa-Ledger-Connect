import { Body, Controller, Post } from '@nestjs/common';
import { ok } from '../../lib/http/api-response';
import { AskLedgerQuestionDto } from './dto/ask-ledger-question.dto';
import { AiService } from './ai.service';

@Controller('ai/ledger')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('insights')
  async generateInsights() {
    return ok(await this.aiService.generateLedgerInsights());
  }

  @Post('query')
  async answerQuestion(@Body() body: AskLedgerQuestionDto) {
    return ok(await this.aiService.answerLedgerQuestion(body.question));
  }
}
