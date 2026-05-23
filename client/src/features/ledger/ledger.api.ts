import { apiRoutes } from '@/routes/api/routes'
import { apiRequest } from '@/lib/http/api-client'
import {
  integrationSummarySchema,
  unifiedProfitAndLossReportSchema,
} from './ledger.schemas'
import type {
  IntegrationSummary,
  UnifiedProfitAndLossReport,
} from './ledger.types'

export async function fetchUnifiedReport(
  signal?: AbortSignal,
): Promise<UnifiedProfitAndLossReport> {
  const report = await apiRequest<UnifiedProfitAndLossReport>(
    apiRoutes.ledger.report,
    { signal },
  )

  return unifiedProfitAndLossReportSchema.parse(report)
}

export async function triggerLedgerIntegration(): Promise<IntegrationSummary> {
  const summary = await apiRequest<IntegrationSummary>(
    apiRoutes.ledger.integrations,
    {
      method: 'POST',
    },
  )

  return integrationSummarySchema.parse(summary)
}
