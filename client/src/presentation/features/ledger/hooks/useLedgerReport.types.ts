import type {
  IntegrationStatus,
  UnifiedProfitAndLossReport,
} from '@/features/ledger'

export type LedgerReportState = {
  report: UnifiedProfitAndLossReport | null
  expandedRowIds: Set<string>
  status: IntegrationStatus
  errorMessage: string | null
}

export type LedgerReportAction =
  | {
      type: 'refresh-started'
    }
  | {
      type: 'refresh-succeeded'
      report: UnifiedProfitAndLossReport
    }
  | {
      type: 'refresh-failed'
      message: string
    }
  | {
      type: 'row-toggled'
      rowId: string
    }

export type UseLedgerReportOptions = {
  initialErrorMessage: string | null
  initialReport: UnifiedProfitAndLossReport | null
}
