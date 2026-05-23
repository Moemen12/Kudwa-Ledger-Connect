import { Injectable } from '@nestjs/common';
import { SourceDataReader } from '../../infrastructure/source-data/source-data.reader';
import { ok } from '../../lib/http/api-response';
import { LedgerRepository } from './ledger.repository';
import { LedgerTransformer } from './ledger.transformer';
import type {
  IntegrationSummary,
  UnifiedProfitAndLossReport,
} from './ledger.types';

@Injectable()
export class LedgerService {
  constructor(
    private readonly sourceDataReader: SourceDataReader,
    private readonly ledgerRepository: LedgerRepository,
    private readonly ledgerTransformer: LedgerTransformer,
  ) {}

  async triggerIntegration() {
    const [quickBooks, rootFi] = await Promise.all([
      this.sourceDataReader.readRequiredJson<unknown>('data_set_1.json'),
      this.sourceDataReader.readRequiredJson<unknown>('data_set_2.json'),
    ]);
    const report = this.ledgerTransformer.buildUnifiedReport({
      quickBooks,
      rootFi,
    });
    this.ledgerRepository.replaceLatestReport(report);

    return ok<IntegrationSummary>({
      status: 'completed',
      reportId: report.id,
      sources: report.sources,
      periodCount: report.periods.length,
      rowCount: report.rows.length,
    });
  }

  getUnifiedReport() {
    return ok(this.getLatestReport());
  }

  getLatestReport(): UnifiedProfitAndLossReport {
    return this.ledgerRepository.findLatestReport();
  }
}
