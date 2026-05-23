import { fetchUnifiedReport, triggerLedgerIntegration } from './ledger.api'

export async function getUnifiedProfitAndLossReport(signal?: AbortSignal) {
  return fetchUnifiedReport(signal)
}

export async function refreshLedgerIntegration() {
  await triggerLedgerIntegration()
  return fetchUnifiedReport()
}
