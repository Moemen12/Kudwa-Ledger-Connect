import { Controller, Get, Post } from '@nestjs/common';
import { LedgerService } from './ledger.service';

@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Post('integrations')
  triggerIntegration() {
    return this.ledgerService.triggerIntegration();
  }

  @Get('report')
  getUnifiedReport() {
    return this.ledgerService.getUnifiedReport();
  }
}
