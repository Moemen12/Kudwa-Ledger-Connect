import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import {
  integrationRuns,
  reportPeriods,
  reportRows,
  reportValues,
  sourceImports,
  sourceRowMappings,
} from '../../infrastructure/database/drizzle/schema';
import type { AppDatabase } from '../../infrastructure/database/providers/database.provider';
import { DATABASE } from '../../infrastructure/database/tokens/database.token';
import { DatabaseWriteError } from '../../lib/errors/application-error';
import type { UnifiedProfitAndLossReport } from './ledger.types';

type InsertExecutor<TTable, TValue> = {
  insert: (table: TTable) => {
    values: (values: TValue[]) => {
      run: () => void;
    };
  };
};

@Injectable()
export class LedgerRepository {
  constructor(@Inject(DATABASE) private readonly db: AppDatabase) {}

  findLatestReport(): UnifiedProfitAndLossReport {
    const run = this.db
      .select()
      .from(integrationRuns)
      .orderBy(desc(integrationRuns.createdAt))
      .limit(1)
      .get();

    if (!run) {
      return this.createEmptyReport();
    }

    const [sources, periods, rows, values, mappings] = [
      this.db
        .select()
        .from(sourceImports)
        .where(eq(sourceImports.runId, run.id))
        .all(),
      this.db
        .select()
        .from(reportPeriods)
        .where(eq(reportPeriods.runId, run.id))
        .orderBy(reportPeriods.startsOn)
        .all(),
      this.db
        .select()
        .from(reportRows)
        .where(eq(reportRows.runId, run.id))
        .orderBy(reportRows.sortOrder)
        .all(),
      this.db
        .select()
        .from(reportValues)
        .where(eq(reportValues.runId, run.id))
        .all(),
      this.db
        .select()
        .from(sourceRowMappings)
        .where(eq(sourceRowMappings.runId, run.id))
        .all(),
    ];
    const valuesByRowId = new Map<string, Record<string, number>>();
    const mappingsByRowId = new Map<
      string,
      { externalId?: string; group?: string }
    >();

    for (const value of values) {
      const rowValues = valuesByRowId.get(value.rowId) ?? {};
      rowValues[value.periodId] = value.value;
      valuesByRowId.set(value.rowId, rowValues);
    }

    for (const mapping of mappings) {
      mappingsByRowId.set(mapping.rowId, {
        externalId: mapping.externalId ?? undefined,
        group: mapping.sourceGroup ?? undefined,
      });
    }

    return {
      id: run.id,
      name: run.name,
      status: run.status,
      generatedAt: run.generatedAt,
      currency: run.currency,
      sources: sources.map((source) => ({
        id: source.sourceId,
        fileName: source.fileName,
        system: source.system,
        reportName: source.reportName,
        periodStart: source.periodStart,
        periodEnd: source.periodEnd,
        currency: source.currency,
        rowsImported: source.rowsImported,
        periodsImported: source.periodsImported,
      })),
      periods: periods.map((period) => ({
        id: period.periodId,
        label: period.label,
        startsOn: period.startsOn,
        endsOn: period.endsOn,
      })),
      rows: rows.map((row) => ({
        id: row.rowId,
        sourceId: row.sourceId,
        parentId: row.parentRowId,
        label: row.label,
        kind: row.kind,
        depth: row.depth,
        sortOrder: row.sortOrder,
        values: valuesByRowId.get(row.rowId) ?? {},
        sourceRef: mappingsByRowId.get(row.rowId),
      })),
    };
  }

  replaceLatestReport(report: UnifiedProfitAndLossReport) {
    try {
      this.db.transaction((tx) => {
        tx.insert(integrationRuns)
          .values({
            id: report.id,
            name: report.name,
            status: report.status,
            generatedAt: report.generatedAt,
            currency: report.currency,
            createdAt: new Date().toISOString(),
          })
          .run();

        tx.insert(sourceImports)
          .values(
            report.sources.map((source) => ({
              runId: report.id,
              sourceId: source.id,
              fileName: source.fileName,
              system: source.system,
              reportName: source.reportName,
              periodStart: source.periodStart,
              periodEnd: source.periodEnd,
              currency: source.currency,
              rowsImported: source.rowsImported,
              periodsImported: source.periodsImported,
            })),
          )
          .run();

        tx.insert(reportPeriods)
          .values(
            report.periods.map((period) => ({
              runId: report.id,
              periodId: period.id,
              label: period.label,
              startsOn: period.startsOn,
              endsOn: period.endsOn,
            })),
          )
          .run();

        this.insertInChunks(
          tx,
          reportRows,
          report.rows.map((row) => ({
            runId: report.id,
            rowId: row.id,
            sourceId: row.sourceId,
            parentRowId: row.parentId,
            label: row.label,
            kind: row.kind,
            depth: row.depth,
            sortOrder: row.sortOrder,
          })),
        );

        const valueRows = report.rows.flatMap((row) =>
          Object.entries(row.values).map(([periodId, value]) => ({
            runId: report.id,
            rowId: row.id,
            periodId,
            value,
          })),
        );

        this.insertInChunks(tx, reportValues, valueRows);

        this.insertInChunks(
          tx,
          sourceRowMappings,
          report.rows.map((row) => ({
            runId: report.id,
            rowId: row.id,
            sourceId: row.sourceId,
            externalId: row.sourceRef?.externalId ?? null,
            sourceGroup: row.sourceRef?.group ?? null,
          })),
        );
      });
    } catch {
      throw new DatabaseWriteError();
    }

    return report;
  }

  private createEmptyReport(): UnifiedProfitAndLossReport {
    return {
      id: 'draft-report',
      name: 'Unified Profit and Loss',
      status: 'empty',
      generatedAt: null,
      currency: 'USD',
      sources: [],
      periods: [],
      rows: [],
    };
  }

  private insertInChunks<TTable, TValue>(
    tx: unknown,
    table: TTable,
    values: TValue[],
  ) {
    const chunkSize = 400;
    const executor = tx as InsertExecutor<TTable, TValue>;

    for (let index = 0; index < values.length; index += chunkSize) {
      const chunk = values.slice(index, index + chunkSize);

      if (chunk.length > 0) {
        executor.insert(table).values(chunk).run();
      }
    }
  }
}
