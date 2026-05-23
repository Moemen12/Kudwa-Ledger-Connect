import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Database, { type Database as SQLiteClient } from 'better-sqlite3';
import { access, mkdir, readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

@Injectable()
export class DatabaseMigrator implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const migrationsDirectory = await this.findMigrationsDirectory();
    if (!migrationsDirectory) return;

    const databasePath = join(
      process.cwd(),
      this.configService.getOrThrow<string>('DATABASE_FILE_PATH'),
    );
    await mkdir(dirname(databasePath), { recursive: true });

    const database: SQLiteClient = new Database(databasePath);

    try {
      const files = await readdir(migrationsDirectory);
      const migrations = files
        .filter((fileName) => fileName.endsWith('.sql'))
        .sort();

      for (const migration of migrations) {
        const sql = await readFile(
          join(migrationsDirectory, migration),
          'utf8',
        );
        database.exec(sql);
      }
    } finally {
      database.close();
    }
  }

  private async findMigrationsDirectory(): Promise<string | undefined> {
    const paths = [
      join(
        process.cwd(),
        'src',
        'infrastructure',
        'database',
        'drizzle',
        'migrations',
      ),
      join(__dirname, 'drizzle', 'migrations'),
      join(
        process.cwd(),
        'dist',
        'infrastructure',
        'database',
        'drizzle',
        'migrations',
      ),
    ];

    for (const path of paths) {
      try {
        await access(path);
        return path;
      } catch {
        continue;
      }
    }
    return undefined;
  }
}
