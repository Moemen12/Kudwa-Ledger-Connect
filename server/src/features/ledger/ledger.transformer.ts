import { Injectable } from '@nestjs/common';
import { InvalidSourceShapeError } from '../../lib/errors/application-error';
import {
  type ProfitAndLossRow,
  type ReportPeriod,
  type ReportSourceMetadata,
  type UnifiedProfitAndLossReport,
} from './ledger.types';

type QuickBooksColumn = {
  ColTitle?: string;
  MetaData?: Array<{ Name?: string; Value?: string }>;
};

type QuickBooksRow = {
  type?: 'Section' | 'Data';
  group?: string;
  Header?: { ColData?: QuickBooksCell[] };
  ColData?: QuickBooksCell[];
  Summary?: { ColData?: QuickBooksCell[] };
  Rows?: { Row?: QuickBooksRow[] };
};

type QuickBooksCell = {
  value?: string;
  id?: string;
};

type QuickBooksDataSet = {
  data?: {
    Header?: {
      ReportName?: string;
      ReportBasis?: string;
      StartPeriod?: string;
      EndPeriod?: string;
      Currency?: string;
    };
    Columns?: { Column?: QuickBooksColumn[] };
    Rows?: { Row?: QuickBooksRow[] };
  };
};

type RootFiLineItem = {
  name?: string;
  value?: number;
  account_id?: string;
  line_items?: RootFiLineItem[];
};

type RootFiPeriod = {
  platform_id?: string;
  period_start?: string;
  period_end?: string;
  revenue?: RootFiLineItem[];
  cost_of_goods_sold?: RootFiLineItem[];
  gross_profit?: number;
  operating_expenses?: RootFiLineItem[];
  operating_profit?: number;
  non_operating_revenue?: RootFiLineItem[];
  non_operating_expenses?: RootFiLineItem[];
  earnings_before_taxes?: number;
  taxes?: number;
  net_profit?: number;
};

type RootFiDataSet = {
  data?: RootFiPeriod[];
};

type MutableRow = ProfitAndLossRow & {
  sortOrder: number;
};

type QuickBooksMoneyColumn = {
  sourceIndex: number;
  period: ReportPeriod | null;
  isTotal: boolean;
};

const ROOTFI_BUCKETS = [
  { key: 'revenue', label: 'Revenue' },
  { key: 'cost_of_goods_sold', label: 'Cost of Goods Sold' },
  { key: 'operating_expenses', label: 'Operating Expenses' },
  { key: 'non_operating_revenue', label: 'Non-operating Revenue' },
  { key: 'non_operating_expenses', label: 'Non-operating Expenses' },
] as const;

const ROOTFI_METRICS = [
  { key: 'gross_profit', label: 'Gross Profit' },
  { key: 'operating_profit', label: 'Operating Profit' },
  { key: 'earnings_before_taxes', label: 'Earnings Before Taxes' },
  { key: 'taxes', label: 'Taxes' },
  { key: 'net_profit', label: 'Net Profit' },
] as const;

@Injectable()
export class LedgerTransformer {
  buildUnifiedReport(input: {
    quickBooks: unknown;
    rootFi: unknown;
  }): UnifiedProfitAndLossReport {
    const quickBooksReport = this.transformQuickBooks(
      input.quickBooks as QuickBooksDataSet,
    );
    const rootFiReport = this.transformRootFi(input.rootFi as RootFiDataSet);
    const periods = this.mergePeriods([
      ...quickBooksReport.periods,
      ...rootFiReport.periods,
    ]);
    const rows = [...quickBooksReport.rows, ...rootFiReport.rows].sort(
      (left, right) => left.sortOrder - right.sortOrder,
    );

    return {
      id: `integration-${Date.now()}`,
      name: 'Unified Profit and Loss',
      status: 'integrated',
      generatedAt: new Date().toISOString(),
      currency: quickBooksReport.source.currency ?? 'USD',
      sources: [quickBooksReport.source, rootFiReport.source],
      periods,
      rows,
    };
  }

  private transformQuickBooks(dataSet: QuickBooksDataSet) {
    const report = dataSet.data;

    if (!report?.Columns?.Column || !report.Rows?.Row) {
      throw new InvalidSourceShapeError(
        'data_set_1.json',
        'QuickBooks-like report with data.Header, data.Columns.Column, and data.Rows.Row.',
      );
    }

    const columns = this.getQuickBooksMoneyColumns(report.Columns.Column);
    const periods = columns
      .map((column) => column.period)
      .filter((period): period is ReportPeriod => period !== null);
    const rows: MutableRow[] = [];
    let sortOrder = 0;

    const visitRows = (
      sourceRows: QuickBooksRow[],
      parentId: string | null,
      depth: number,
      path: string[],
    ) => {
      for (const sourceRow of sourceRows) {
        const labelCells = this.getQuickBooksLabelCells(sourceRow);
        const valueCells = this.getQuickBooksValueCells(sourceRow);
        const label =
          labelCells[0]?.value ||
          sourceRow.Summary?.ColData?.[0]?.value ||
          sourceRow.group ||
          'Untitled row';
        const id = this.createRowId('quickbooks', [
          ...path,
          label,
          String(sortOrder),
        ]);
        const values = this.getQuickBooksValues(valueCells, columns);

        rows.push({
          id,
          sourceId: 'data-set-1',
          parentId,
          label,
          kind: sourceRow.type === 'Data' ? 'account' : 'section',
          depth,
          sortOrder: sortOrder++,
          values,
          sourceRef: {
            externalId: labelCells[0]?.id,
            group: sourceRow.group,
          },
        });

        if (sourceRow.Rows?.Row?.length) {
          visitRows(sourceRow.Rows.Row, id, depth + 1, [...path, label]);
        }
      }
    };

    visitRows(report.Rows.Row, null, 0, []);

    return {
      periods,
      rows,
      source: {
        id: 'data-set-1',
        fileName: 'data_set_1.json',
        system: 'quickbooks-report',
        reportName: report.Header?.ReportName ?? 'ProfitAndLoss',
        periodStart: report.Header?.StartPeriod ?? periods[0]?.startsOn ?? null,
        periodEnd: report.Header?.EndPeriod ?? periods.at(-1)?.endsOn ?? null,
        currency: report.Header?.Currency ?? 'USD',
        rowsImported: rows.length,
        periodsImported: periods.length,
      } satisfies ReportSourceMetadata,
    };
  }

  private transformRootFi(dataSet: RootFiDataSet) {
    if (!Array.isArray(dataSet.data)) {
      throw new InvalidSourceShapeError(
        'data_set_2.json',
        'RootFi-like object with data as an array of period profit-and-loss records.',
      );
    }

    const sourcePeriods = [...dataSet.data].sort((left, right) =>
      String(left.period_start).localeCompare(String(right.period_start)),
    );
    const periods = sourcePeriods.map((period) => ({
      id: this.createPeriodId(period.period_start, period.period_end),
      label: this.formatPeriodLabel(period.period_start),
      startsOn: period.period_start ?? '',
      endsOn: period.period_end ?? '',
    }));
    const periodIds = sourcePeriods.map((period) =>
      this.createPeriodId(period.period_start, period.period_end),
    );
    const rowsById = new Map<string, MutableRow>();
    let sortOrder = 10_000;

    const ensureRow = (
      id: string,
      row: Omit<MutableRow, 'values' | 'sortOrder'>,
    ) => {
      const existing = rowsById.get(id);

      if (existing) {
        return existing;
      }

      const nextRow: MutableRow = {
        ...row,
        sortOrder: sortOrder++,
        values: {},
      };
      rowsById.set(id, nextRow);
      return nextRow;
    };

    sourcePeriods.forEach((period, periodIndex) => {
      const periodId = periodIds[periodIndex];

      ROOTFI_BUCKETS.forEach((bucket) => {
        const bucketRowId = this.createRowId('rootfi', [bucket.key]);
        ensureRow(bucketRowId, {
          id: bucketRowId,
          sourceId: 'data-set-2',
          parentId: null,
          label: bucket.label,
          kind: 'section',
          depth: 0,
          sourceRef: { group: bucket.key },
        });

        const lineItems = period[bucket.key] ?? [];
        lineItems.forEach((lineItem) => {
          this.visitRootFiLineItem({
            lineItem,
            parentId: bucketRowId,
            depth: 1,
            path: [bucket.key],
            periodId,
            rowsById,
            ensureRow,
          });
        });
      });

      ROOTFI_METRICS.forEach((metric) => {
        const value = period[metric.key];

        if (typeof value !== 'number') {
          return;
        }

        const rowId = this.createRowId('rootfi', ['metrics', metric.key]);
        const row = ensureRow(rowId, {
          id: rowId,
          sourceId: 'data-set-2',
          parentId: null,
          label: metric.label,
          kind: 'metric',
          depth: 0,
          sourceRef: { group: 'metrics' },
        });
        row.values[periodId] = value;
      });
    });

    return {
      periods,
      rows: Array.from(rowsById.values()),
      source: {
        id: 'data-set-2',
        fileName: 'data_set_2.json',
        system: 'rootfi-periods',
        reportName: 'ProfitAndLoss',
        periodStart: periods[0]?.startsOn ?? null,
        periodEnd: periods.at(-1)?.endsOn ?? null,
        currency: 'USD',
        rowsImported: rowsById.size,
        periodsImported: periods.length,
      } satisfies ReportSourceMetadata,
    };
  }

  private visitRootFiLineItem(input: {
    lineItem: RootFiLineItem;
    parentId: string;
    depth: number;
    path: string[];
    periodId: string;
    rowsById: Map<string, MutableRow>;
    ensureRow: (
      id: string,
      row: Omit<MutableRow, 'values' | 'sortOrder'>,
    ) => MutableRow;
  }) {
    const label = input.lineItem.name ?? 'Untitled line item';
    const rowId = this.createRowId('rootfi', [...input.path, label]);
    const row = input.ensureRow(rowId, {
      id: rowId,
      sourceId: 'data-set-2',
      parentId: input.parentId,
      label,
      kind: input.lineItem.line_items?.length ? 'section' : 'account',
      depth: input.depth,
      sourceRef: {
        externalId: input.lineItem.account_id,
      },
    });

    if (typeof input.lineItem.value === 'number') {
      row.values[input.periodId] = input.lineItem.value;
    }

    input.lineItem.line_items?.forEach((child) => {
      this.visitRootFiLineItem({
        ...input,
        lineItem: child,
        parentId: rowId,
        depth: input.depth + 1,
        path: [...input.path, label],
      });
    });
  }

  private getQuickBooksMoneyColumns(columns: QuickBooksColumn[]) {
    return columns
      .map<QuickBooksMoneyColumn | null>((column, index) => {
        if (index === 0) {
          return null;
        }

        const startDate = this.getMetaData(column, 'StartDate');
        const endDate = this.getMetaData(column, 'EndDate');
        const title = column.ColTitle ?? '';
        const isTotal = title.toLowerCase() === 'total';

        return {
          sourceIndex: index,
          isTotal,
          period:
            startDate && endDate && !isTotal
              ? {
                  id: this.createPeriodId(startDate, endDate),
                  label: title,
                  startsOn: startDate,
                  endsOn: endDate,
                }
              : null,
        };
      })
      .filter((column): column is QuickBooksMoneyColumn => column !== null);
  }

  private getQuickBooksLabelCells(row: QuickBooksRow) {
    return row.ColData ?? row.Header?.ColData ?? row.Summary?.ColData ?? [];
  }

  private getQuickBooksValueCells(row: QuickBooksRow) {
    return row.ColData ?? row.Summary?.ColData ?? row.Header?.ColData ?? [];
  }

  private getQuickBooksValues(
    cells: QuickBooksCell[],
    columns: QuickBooksMoneyColumn[],
  ) {
    const values: Record<string, number> = {};

    for (const column of columns) {
      if (!column.period || column.isTotal) {
        continue;
      }

      const parsedValue = this.parseMoney(cells[column.sourceIndex]?.value);

      if (parsedValue !== null) {
        values[column.period.id] = parsedValue;
      }
    }

    return values;
  }

  private mergePeriods(periods: ReportPeriod[]) {
    return Array.from(
      new Map(periods.map((period) => [period.id, period])).values(),
    ).sort((left, right) => left.startsOn.localeCompare(right.startsOn));
  }

  private getMetaData(column: QuickBooksColumn, name: string) {
    return column.MetaData?.find((entry) => entry.Name === name)?.Value;
  }

  private parseMoney(value: string | undefined) {
    if (!value) {
      return null;
    }

    const normalized = Number(value.replaceAll(',', ''));
    return Number.isFinite(normalized) ? normalized : null;
  }

  private createPeriodId(
    startDate: string | undefined,
    endDate: string | undefined,
  ) {
    return `${startDate ?? 'unknown'}_${endDate ?? 'unknown'}`;
  }

  private formatPeriodLabel(startDate: string | undefined) {
    if (!startDate) {
      return 'Unknown period';
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${startDate}T00:00:00Z`));
  }

  private createRowId(source: string, parts: string[]) {
    const slug = parts
      .join('-')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    return `${source}:${slug}`;
  }
}
