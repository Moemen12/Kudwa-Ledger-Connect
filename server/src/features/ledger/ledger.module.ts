import { Module } from '@nestjs/common';
import { SourceDataReader } from '../../infrastructure/source-data/source-data.reader';
import { LedgerController } from './ledger.controller';
import { LedgerRepository } from './ledger.repository';
import { LedgerService } from './ledger.service';
import { LedgerTransformer } from './ledger.transformer';

@Module({
  controllers: [LedgerController],
  providers: [
    SourceDataReader,
    LedgerRepository,
    LedgerService,
    LedgerTransformer,
  ],
  exports: [LedgerService],
})
export class LedgerModule {}
