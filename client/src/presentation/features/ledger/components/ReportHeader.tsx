import type { IntegrationStatus } from '@/features/ledger'
import { Button } from '@/presentation/components/ui/button'

type ReportHeaderProps = {
  hasIntegratedReport: boolean
  status: IntegrationStatus
  onRefreshIntegration: () => Promise<void>
}

export function ReportHeader({
  hasIntegratedReport,
  status,
  onRefreshIntegration,
}: ReportHeaderProps) {
  const isRunning = status === 'running'

  return (
    <header className="mb-5 flex flex-col items-start justify-between gap-6 lg:flex-row">
      <div>
        <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.08em] text-teal-700">
          Profit and loss
        </p>
        <h1 className="mb-3 text-4xl font-semibold leading-tight tracking-normal text-slate-950">
          Kudwa Ledger Connect
        </h1>
        <p className="max-w-3xl text-base leading-6 text-slate-600">
          Unified P&L report normalized from both source files.
        </p>
      </div>

      <div
        className="grid w-full min-w-0 justify-items-stretch gap-2.5 lg:w-auto lg:min-w-[260px] lg:justify-items-end"
        aria-live="polite"
      >
        <Button
          className="w-full lg:w-auto"
          onClick={() => void onRefreshIntegration()}
          disabled={isRunning}
        >
          {isRunning ? 'Integrating...' : 'Trigger integration'}
        </Button>
        <p className={`m-0 text-left text-sm lg:text-right ${getStatusClassName(status)}`}>
          {getStatusMessage(status, hasIntegratedReport)}
        </p>
      </div>
    </header>
  )
}

function getStatusMessage(
  status: IntegrationStatus,
  hasIntegratedReport: boolean,
) {
  if (status === 'running') {
    return 'Reading sources, transforming rows, and loading SQLite.'
  }

  if (status === 'succeeded') {
    return 'Integration completed.'
  }

  if (status === 'failed') {
    return 'Integration failed.'
  }

  return hasIntegratedReport ? 'Latest report loaded.' : 'Ready to integrate.'
}

function getStatusClassName(status: IntegrationStatus) {
  if (status === 'running') {
    return 'text-amber-700'
  }

  if (status === 'succeeded') {
    return 'text-emerald-700'
  }

  if (status === 'failed') {
    return 'text-red-700'
  }

  return 'text-slate-600'
}
