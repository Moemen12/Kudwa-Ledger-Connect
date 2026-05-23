import type {
  ProfitAndLossRow,
  ReportKpi,
  ReportPeriod,
  UnifiedProfitAndLossReport,
} from './ledger.types'

const KPI_DEFINITIONS = [
  {
    id: 'total-income',
    label: 'Total Income',
    rowMatchers: ['total income', 'income'],
    tone: 'success',
  },
  {
    id: 'total-expenses',
    label: 'Total Expenses',
    rowMatchers: ['total expenses', 'expenses'],
    tone: 'danger',
  },
  {
    id: 'net-operating-income',
    label: 'Net Operating Income',
    rowMatchers: ['net operating income'],
    tone: 'success',
  },
  {
    id: 'net-income',
    label: 'Net Income',
    rowMatchers: ['net income'],
    tone: 'success',
  },
] as const

const FALLBACK_KPI_LABELS = [
  'gross profit',
  'revenue',
  'cost of goods sold',
  'operating expenses',
  'other income',
] as const

export function getTopLevelRowIds(report: UnifiedProfitAndLossReport) {
  return report.rows
    .filter((row) => row.parentId === null)
    .map((row) => row.id)
}

export function getVisibleReportRows(
  rows: ProfitAndLossRow[],
  expandedRowIds: Set<string>,
) {
  const parentIdByRowId = new Map(rows.map((row) => [row.id, row.parentId]))

  return rows.filter((row) => {
    if (row.parentId === null) {
      return true
    }

    let parentId: string | null = row.parentId

    while (parentId) {
      if (!expandedRowIds.has(parentId)) {
        return false
      }

      parentId = parentIdByRowId.get(parentId) ?? null
    }

    return true
  })
}

export function getChildRowCounts(rows: ProfitAndLossRow[]) {
  return rows.reduce<Record<string, number>>((counts, row) => {
    if (row.parentId) {
      counts[row.parentId] = (counts[row.parentId] ?? 0) + 1
    }

    return counts
  }, {})
}

export function formatCurrency(value: number | undefined, currency: string) {
  if (value === undefined) {
    return '-'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

export function getReportKpis(
  report: UnifiedProfitAndLossReport | null,
  periods: ReportPeriod[],
): ReportKpi[] {
  if (!report) {
    return []
  }

  const usedRowIds = new Set<string>()

  return KPI_DEFINITIONS.map((definition) => {
    const row =
      findBestRowMatch(report.rows, definition.rowMatchers, usedRowIds) ??
      findFallbackKpiRow(report.rows, periods, usedRowIds)
    const trend = buildTrend(row, periods)
    const meaningfulTrend = getMeaningfulTrend(trend)
    const firstValue = meaningfulTrend[0]?.value ?? 0
    const latestPoint = meaningfulTrend.at(-1)
    const latestValue = latestPoint?.value ?? 0
    const changePercent = calculateChangePercent(firstValue, latestValue)

    if (row) {
      usedRowIds.add(row.id)
    }

    return {
      id: definition.id,
      label: definition.label,
      sourceRowLabel: row?.label ?? definition.label,
      valuePeriodLabel: latestPoint?.label ?? null,
      value: latestValue,
      changePercent,
      direction: getDirection(changePercent),
      tone: definition.tone,
      trend,
    }
  })
}

function findBestRowMatch(
  rows: ProfitAndLossRow[],
  matchers: readonly string[],
  usedRowIds: Set<string>,
) {
  const normalizedMatchers = matchers.map(normalizeLabel)

  return rows.find(
    (row) =>
      !usedRowIds.has(row.id) &&
      normalizedMatchers.includes(normalizeLabel(row.label)),
  )
}

function findFallbackKpiRow(
  rows: ProfitAndLossRow[],
  periods: ReportPeriod[],
  usedRowIds: Set<string>,
) {
  const fallbackLabels = new Set<string>(FALLBACK_KPI_LABELS)

  return rows
    .filter((row) => !usedRowIds.has(row.id))
    .filter((row) => fallbackLabels.has(normalizeLabel(row.label)))
    .filter((row) => hasAnyValue(row, periods))
    .sort(
      (left, right) =>
        getLatestAbsoluteValue(right, periods) -
        getLatestAbsoluteValue(left, periods),
    )[0]
}

function buildTrend(row: ProfitAndLossRow | undefined, periods: ReportPeriod[]) {
  return periods.map((period) => {
    const rawValue = row?.values[period.id]

    return {
      hasValue: rawValue !== undefined,
      periodId: period.id,
      label: period.label,
      value: rawValue ?? 0,
    }
  })
}

function getMeaningfulTrend(trend: ReturnType<typeof buildTrend>) {
  const nonZeroTrend = trend.filter(
    (point) => point.hasValue && point.value !== 0,
  )

  if (nonZeroTrend.length > 0) {
    return nonZeroTrend
  }

  return trend.filter((point) => point.hasValue)
}

function hasAnyValue(row: ProfitAndLossRow, periods: ReportPeriod[]) {
  return periods.some((period) => row.values[period.id] !== undefined)
}

function getLatestAbsoluteValue(row: ProfitAndLossRow, periods: ReportPeriod[]) {
  const latestPeriod = periods.findLast(
    (period) => row.values[period.id] !== undefined,
  )

  return latestPeriod ? Math.abs(row.values[latestPeriod.id] ?? 0) : 0
}

function normalizeLabel(label: string) {
  return label.toLowerCase().replaceAll(/\s+/g, ' ').trim()
}

function calculateChangePercent(firstValue: number, latestValue: number) {
  if (firstValue === 0) {
    return latestValue === 0 ? 0 : null
  }

  return ((latestValue - firstValue) / Math.abs(firstValue)) * 100
}

function getDirection(changePercent: number | null) {
  if (changePercent === null || Math.abs(changePercent) < 0.1) {
    return 'flat'
  }

  return changePercent > 0 ? 'up' : 'down'
}
