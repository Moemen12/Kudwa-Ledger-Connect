import { Global, Module } from '@nestjs/common';
import { DatabaseMigrator } from './database.migrator';
import { databaseProvider } from './providers/database.provider';

@Global()
@Module({
  providers: [databaseProvider, DatabaseMigrator],
  exports: [databaseProvider],
})
export class DatabaseModule {}
