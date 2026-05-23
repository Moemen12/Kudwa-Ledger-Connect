import { ConfigService } from '@nestjs/config';
import Database, { type Database as SQLiteClient } from 'better-sqlite3';
import {
  drizzle,
  type BetterSQLite3Database,
} from 'drizzle-orm/better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import * as schema from '../drizzle/schema';
import { DATABASE } from '../tokens/database.token';

export type AppDatabase = BetterSQLite3Database<typeof schema>;

export const databaseProvider = {
  provide: DATABASE,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): AppDatabase => {
    const databasePath = join(
      process.cwd(),
      configService.getOrThrow<string>('DATABASE_FILE_PATH'),
    );
    mkdirSync(dirname(databasePath), { recursive: true });

    const sqlite: SQLiteClient = new Database(databasePath);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');

    return drizzle(sqlite, { schema });
  },
};
