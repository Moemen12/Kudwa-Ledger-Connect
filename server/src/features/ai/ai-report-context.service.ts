import { Injectable } from '@nestjs/common';
import type {
  ProfitAndLossRow,
  ReportPeriod,
  UnifiedProfitAndLossReport,
} from '../ledger/ledger.types';
import type {
  AiReportContext,
  ReportSnapshot,
  ReportSnapshotRow,
  ReportValuePoint,
} from './ai.types';

const SNAPSHOT_ROW_LABELS = [
  'Income',
  'Revenue',
  'Cost of Goods Sold',
  'Gross Profit',
  'Expenses',
  'Operating Expenses',
  'Net Operating Income',
  'Net Income',
  'Other Income',
  'Other Expenses',
] as const;

@Injectable()
export class AiReportContextService {
  build(report: UnifiedProfitAndLossReport): AiReportContext {
    return {
      report,
      periods: this.getRecentPeriodsWithValues(report, 8),
      rows: report.rows,
    };
  }

  buildSnapshot(context: AiReportContext): ReportSnapshot {
    return {
      currency: context.report.currency,
      generatedAt: context.report.generatedAt,
      reportName: context.report.name,
      periods: context.periods.map((period) => period.label),
      rows: SNAPSHOT_ROW_LABELS.map((label) => findRow(context.rows, label))
        .filter((row): row is ProfitAndLossRow => Boolean(row))
        .map<ReportSnapshotRow>((row) => ({
          label: row.label,
          values: context.periods.map((period) => ({
            label: period.label,
            value: row.values[period.id] ?? 0,
          })),
        })),
    };
  }

  private getRecentPeriodsWithValues(
    report: UnifiedProfitAndLossReport,
    count: number,
  ) {
    return report.periods
      .filter((period) =>
        report.rows.some((row) => row.values[period.id] !== undefined),
      )
      .slice(-count);
  }
}

export function findRow(rows: ProfitAndLossRow[], label: string) {
  return rows.find(
    (row) => normalizeLabel(row.label) === normalizeLabel(label),
  );
}

export function getLatestValue(
  row: ProfitAndLossRow,
  periods: ReportPeriod[],
): ReportValuePoint | null {
  const period = periods.findLast(
    (period) => row.values[period.id] !== undefined,
  );

  if (!period) {
    return null;
  }

  return {
    period,
    value: row.values[period.id] ?? 0,
  };
}

export function getLargestAbsoluteValue(
  row: ProfitAndLossRow,
  periods: ReportPeriod[],
) {
  return periods
    .map((period) => ({
      period,
      value: row.values[period.id] ?? 0,
    }))
    .sort((left, right) => Math.abs(right.value) - Math.abs(left.value))[0];
}

export function getQuarterPeriods(periods: ReportPeriod[], quarter: number) {
  const startMonth = (quarter - 1) * 3;

  return periods.filter((period) => {
    const month = new Date(`${period.startsOn}T00:00:00.000Z`).getUTCMonth();

    return month >= startMonth && month < startMonth + 3;
  });
}

export function sumRowValues(row: ProfitAndLossRow, periods: ReportPeriod[]) {
  return periods.reduce((sum, period) => sum + (row.values[period.id] ?? 0), 0);
}

export function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    currency,
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value);
}

export function normalizeLabel(label: string) {
  return label.toLowerCase().replaceAll(/\s+/g, ' ').trim();
}
