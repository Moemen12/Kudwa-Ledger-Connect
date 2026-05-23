import { Suspense, use, useMemo } from 'react'
import {
  getUnifiedProfitAndLossReport,
  type UnifiedProfitAndLossReport,
} from '@/features/ledger'
import { ProfitAndLossTable } from './ProfitAndLossTable'
import { ReportHeader } from './ReportHeader'
import { LedgerReportSkeleton } from './LedgerReportSkeleton'
import { LedgerInsightsPanel } from './LedgerInsightsPanel'
import { ReportFeedback } from './ReportFeedback'
import { ReportKpiCards } from './ReportKpiCards'
import { useLedgerReport } from '../hooks/useLedgerReport'
import { ErrorBoundary } from '@/presentation/components/shared/ErrorBoundary'

const RECENT_PERIOD_COUNT = 12

type InitialReportLoadResult =
  | { status: 'success'; report: UnifiedProfitAndLossReport }
  | { status: 'failed'; message: string }

async function fetchReport(): Promise<InitialReportLoadResult> {
  try {
    const report = await getUnifiedProfitAndLossReport()
    return { status: 'success', report }
  } catch (error: unknown) {
    return { status: 'failed', message: getErrorMessage(error) }
  }
}

const reportPromise = fetchReport()

export function LedgerReportScreen() {
  return (
    <section className="mx-auto w-full max-w-[1540px]">
      <ErrorBoundary
        fallback={
          <ReportFeedback tone="danger">
            Something went wrong while rendering the ledger report.
          </ReportFeedback>
        }
      >
        <Suspense fallback={<LedgerReportSkeleton />}>
          <LedgerReportContent />
        </Suspense>
      </ErrorBoundary>
    </section>
  )
}

function LedgerReportContent() {
  const initialLoad = use(reportPromise)
  const initialReport =
    initialLoad.status === 'success' ? initialLoad.report : null
  const initialErrorMessage =
    initialLoad.status === 'failed' ? initialLoad.message : null

  const {
    report,
    visibleRows,
    childRowCounts,
    expandedRowIds,
    status,
    errorMessage,
    refreshIntegration,
    toggleRow,
  } = useLedgerReport({ initialErrorMessage, initialReport })

  const periods = useMemo(
    () => report?.periods.slice(-RECENT_PERIOD_COUNT) ?? [],
    [report?.periods],
  )

  const hasIntegratedReport = report?.status === 'integrated'

  return (
    <>
      <ReportHeader
        hasIntegratedReport={hasIntegratedReport}
        status={status}
        onRefreshIntegration={refreshIntegration}
      />

      {errorMessage ? (
        <ReportFeedback tone="danger">{errorMessage}</ReportFeedback>
      ) : null}

      <ReportKpiCards periods={periods} report={report} />

      <LedgerInsightsPanel
        accountRows={report?.rows ?? []}
        currency={report?.currency ?? 'USD'}
        hasIntegratedReport={hasIntegratedReport}
      />

      <ProfitAndLossTable
        childRowCounts={childRowCounts}
        expandedRowIds={expandedRowIds}
        onToggleRow={toggleRow}
        periods={periods}
        report={report}
        rows={visibleRows}
      />
    </>
  )
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.'
}