import { memo, useState } from 'react'
import { formatCurrency } from '@/features/ledger'
import type {
  ProfitAndLossRow,
  ReportPeriod,
  UnifiedProfitAndLossReport,
} from '@/features/ledger'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table'
import { Button } from '@/presentation/components/ui/button'
import { ReportFeedback } from './ReportFeedback'

type ProfitAndLossTableProps = {
  childRowCounts: Record<string, number>
  expandedRowIds: Set<string>
  onToggleRow: (rowId: string) => void
  periods: ReportPeriod[]
  report: UnifiedProfitAndLossReport | null
  rows: ProfitAndLossRow[]
}

type ProfitAndLossTableRowProps = {
  childRowCount: number
  currency: string
  isExpanded: boolean
  onToggleRow: (rowId: string) => void
  periods: ReportPeriod[]
  row: ProfitAndLossRow
}

const VISIBLE_PERIODS_COUNT = 8

const ACCOUNT_HEADER_CLASS =
  'sticky left-0 top-0 z-30 h-10 w-[280px] min-w-[280px] max-w-[280px] border-b border-slate-200 bg-slate-100 px-5 py-2 text-left text-xs font-semibold uppercase text-slate-600 sm:w-[360px] sm:min-w-[360px] sm:max-w-[360px]'

const PERIOD_HEADER_CLASS =
  'sticky top-0 z-20 h-10 min-w-[110px] border-b border-slate-200 bg-slate-100 px-4 py-2 text-right text-xs font-semibold uppercase text-slate-600'

export function ProfitAndLossTable({
  childRowCounts,
  expandedRowIds,
  onToggleRow,
  periods,
  report,
  rows,
}: ProfitAndLossTableProps) {
  const [showAllMonths, setShowAllMonths] = useState(false)

  const hasIntegratedReport = report?.status === 'integrated'
  const hasHiddenPeriods = periods.length > VISIBLE_PERIODS_COUNT

  const visiblePeriods = showAllMonths
    ? periods
    : periods.slice(0, VISIBLE_PERIODS_COUNT)

  const hiddenPeriods = periods.slice(VISIBLE_PERIODS_COUNT)

  const monthsRangeLabel =
    hiddenPeriods.length > 0
      ? `${hiddenPeriods[0]?.label} - ${
          hiddenPeriods[hiddenPeriods.length - 1]?.label
        }`
      : null

  const handleToggleMonths = () => {
    setShowAllMonths((current) => !current)
  }

  return (
    <section
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(22,27,36,0.08)]"
      aria-label="Unified profit and loss report"
    >
      {!hasIntegratedReport ? (
        <ReportFeedback>
          Run integration to load the unified profit-and-loss report.
        </ReportFeedback>
      ) : (
        <>
          {hasHiddenPeriods ? (
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-950">
                  Profit and loss details
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  {showAllMonths
                    ? 'Showing all available months.'
                    : monthsRangeLabel
                      ? `Showing recent months. More months available: ${monthsRangeLabel}.`
                      : 'Showing recent months.'}
                </p>
              </div>

              <Button
                variant="outline"
                className={`shrink-0 rounded-lg ${!showAllMonths ? 'lg:hidden' : ''}`}
                onClick={handleToggleMonths}
              >
                {showAllMonths ? 'Show Recent Months' : 'See More Months'}
              </Button>
            </div>
          ) : null}

          <div
            className={
              hasHiddenPeriods && !showAllMonths
                ? 'grid lg:grid-cols-[minmax(0,1fr)_186px]'
                : 'grid'
            }
          >
            <div className="overflow-x-auto">
              <Table className="min-w-[1180px] border-separate border-spacing-0">
                <TableHeader>
                  <TableRow>
                    <TableHead className={ACCOUNT_HEADER_CLASS} scope="col">
                      Account
                    </TableHead>

                    {visiblePeriods.map((period) => (
                      <TableHead
                        className={PERIOD_HEADER_CLASS}
                        key={period.id}
                        scope="col"
                      >
                        {period.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {rows.map((row) => (
                    <ProfitAndLossTableRow
                      childRowCount={childRowCounts[row.id] ?? 0}
                      currency={report.currency}
                      isExpanded={expandedRowIds.has(row.id)}
                      key={row.id}
                      onToggleRow={onToggleRow}
                      periods={visiblePeriods}
                      row={row}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            {hasHiddenPeriods && !showAllMonths ? (
              <aside className="hidden border-l border-slate-200 bg-white lg:grid lg:place-items-center">
                <Button
                  variant="outline"
                  className="rounded-lg px-4 font-semibold"
                  onClick={handleToggleMonths}
                >
                  See More Months
                </Button>
              </aside>
            ) : null}
          </div>
        </>
      )}
    </section>
  )
}

const ProfitAndLossTableRow = memo(function ProfitAndLossTableRow({
  childRowCount,
  currency,
  isExpanded,
  onToggleRow,
  periods,
  row,
}: ProfitAndLossTableRowProps) {
  const hasChildren = childRowCount > 0

  return (
    <TableRow className={getRowClassName(row.kind)}>
      <TableHead className={getRowHeaderClassName(row.kind)} scope="row">
        <div
          className="flex min-w-0 items-center gap-2"
          style={{ paddingLeft: `${row.depth * 18}px` }}
        >
          {hasChildren ? (
            <button
              className="grid size-6 shrink-0 place-items-center rounded-md text-slate-700 transition hover:bg-slate-200 hover:text-slate-950"
              type="button"
              onClick={() => onToggleRow(row.id)}
              aria-expanded={isExpanded}
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${row.label}`}
            >
              <span className="text-base leading-none">
                {isExpanded ? '⌄' : '›'}
              </span>
            </button>
          ) : (
            <span className="size-6 shrink-0" />
          )}

          <span className="overflow-hidden text-ellipsis">{row.label}</span>
        </div>
      </TableHead>

      {periods.map((period) => (
        <TableCell className={getCellClassName(row.kind)} key={period.id}>
          {formatCurrency(row.values[period.id], currency)}
        </TableCell>
      ))}
    </TableRow>
  )
})

function getRowClassName(kind: ProfitAndLossRow['kind']) {
  if (kind === 'metric') {
    return 'font-bold'
  }

  if (kind === 'section') {
    return 'font-semibold'
  }

  return ''
}

function getRowHeaderClassName(kind: ProfitAndLossRow['kind']) {
  const base =
    'sticky left-0 z-20 h-10 w-[280px] min-w-[280px] max-w-[280px] whitespace-nowrap border-b border-slate-200 px-5 py-2 text-left text-slate-950 sm:w-[360px] sm:min-w-[360px] sm:max-w-[360px]'

  if (kind === 'section') {
    return `${base} bg-gradient-to-r from-slate-100 to-slate-50 font-semibold`
  }

  if (kind === 'metric') {
    return `${base} bg-gradient-to-r from-slate-200 to-slate-100 font-bold`
  }

  return `${base} bg-white font-normal`
}

function getCellClassName(kind: ProfitAndLossRow['kind']) {
  const base =
    'h-10 min-w-[110px] whitespace-nowrap border-b border-slate-200 px-4 py-2 text-right tabular-nums text-slate-950'

  if (kind === 'section') {
    return `${base} bg-gradient-to-r from-slate-100 to-slate-50 font-semibold`
  }

  if (kind === 'metric') {
    return `${base} bg-gradient-to-r from-slate-200 to-slate-100 font-bold`
  }

  return `${base} bg-white font-normal`
}
