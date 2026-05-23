import { useCallback, useMemo, useReducer } from 'react'
import {
  getChildRowCounts,
  getVisibleReportRows,
  refreshLedgerIntegration,
} from '@/features/ledger'
import type { UnifiedProfitAndLossReport } from '@/features/ledger'
import type {
  LedgerReportAction,
  LedgerReportState,
  UseLedgerReportOptions,
} from './useLedgerReport.types'

export function useLedgerReport(options: UseLedgerReportOptions) {
  const [state, dispatch] = useReducer(
    ledgerReportReducer,
    options,
    createInitialState,
  )

  const refreshIntegration = useCallback(async () => {
    dispatch({ type: 'refresh-started' })

    try {
      const nextReport = await refreshLedgerIntegration()
      dispatch({ type: 'refresh-succeeded', report: nextReport })
    } catch (error) {
      dispatch({ type: 'refresh-failed', message: getErrorMessage(error) })
    }
  }, [])

  const toggleRow = useCallback((rowId: string) => {
    dispatch({ type: 'row-toggled', rowId })
  }, [])

  const visibleRows = useMemo(
    () =>
      state.report
        ? getVisibleReportRows(state.report.rows, state.expandedRowIds)
        : [],
    [state.expandedRowIds, state.report],
  )

  const childRowCounts = useMemo(
    () => (state.report ? getChildRowCounts(state.report.rows) : {}),
    [state.report],
  )

  return {
    report: state.report,
    visibleRows,
    childRowCounts,
    expandedRowIds: state.expandedRowIds,
    status: state.status,
    errorMessage: state.errorMessage,
    refreshIntegration,
    toggleRow,
  }
}

function ledgerReportReducer(
  state: LedgerReportState,
  action: LedgerReportAction,
): LedgerReportState {
  switch (action.type) {
    case 'refresh-started':
      return {
        ...state,
        status: 'running',
        errorMessage: null,
      }

    case 'refresh-succeeded':
      return applyReport(state, action.report, {
        status: 'succeeded',
        errorMessage: null,
      })

    case 'refresh-failed':
      return {
        ...state,
        status: 'failed',
        errorMessage: action.message,
      }

    case 'row-toggled':
      return {
        ...state,
        expandedRowIds: toggleExpandedRow(state.expandedRowIds, action.rowId),
      }
  }
}

function createInitialState({
  initialErrorMessage,
  initialReport,
}: UseLedgerReportOptions): LedgerReportState {
  return {
    report: initialReport,
    expandedRowIds: new Set(),
    status: 'idle',
    errorMessage: initialErrorMessage,
  }
}

function applyReport(
  state: LedgerReportState,
  report: UnifiedProfitAndLossReport,
  patch: Partial<LedgerReportState>,
): LedgerReportState {
  return {
    ...state,
    ...patch,
    report,
    expandedRowIds: new Set(),
  }
}

function toggleExpandedRow(expandedRowIds: Set<string>, rowId: string) {
  const next = new Set(expandedRowIds)

  if (next.has(rowId)) {
    next.delete(rowId)
  } else {
    next.add(rowId)
  }

  return next
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.'
}