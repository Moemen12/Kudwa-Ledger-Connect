import { apiRoutes } from '@/routes/api/routes'
import { apiRequest } from '@/lib/http/api-client'
import { aiInsightsResultSchema, aiQueryAnswerSchema } from './ai.schemas'
import type { AiInsightsResult, AiQueryAnswer } from './ai.types'

export async function fetchLedgerInsights(): Promise<AiInsightsResult> {
  const insights = await apiRequest<AiInsightsResult>(
    apiRoutes.ai.ledger.insights,
    {
      method: 'POST',
    },
  )

  return aiInsightsResultSchema.parse(insights)
}

export async function askLedgerQuestion(
  question: string,
): Promise<AiQueryAnswer> {
  const answer = await apiRequest<AiQueryAnswer>(apiRoutes.ai.ledger.query, {
    body: JSON.stringify({ question }),
    method: 'POST',
  })

  return aiQueryAnswerSchema.parse(answer)
}
