import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from './features/ai/ai.module';
import { HealthModule } from './features/health/health.module';
import { LedgerModule } from './features/ledger/ledger.module';
import { validateEnvironment } from './infrastructure/config/env.validation';
import { DatabaseModule } from './infrastructure/database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    DatabaseModule,
    HealthModule,
    LedgerModule,
    AiModule,
  ],
})
export class AppModule {}
