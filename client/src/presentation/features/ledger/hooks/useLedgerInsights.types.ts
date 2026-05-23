import type { AiInsightsResult, AiQueryAnswer } from '@/features/ai'

export type LedgerInsightsState = {
  insightsErrorMessage: string | null
  insightsResult: AiInsightsResult | null
  insightsStatus: 'idle' | 'failed' | 'running' | 'succeeded'
  queryAnswer: AiQueryAnswer | null
  queryErrorMessage: string | null
  queryStatus: 'idle' | 'failed' | 'running' | 'succeeded'
}

export type LedgerInsightsAction =
  | {
      type: 'generation-started'
    }
  | {
      type: 'generation-succeeded'
      result: AiInsightsResult
    }
  | {
      type: 'generation-failed'
      message: string
    }
  | {
      type: 'question-started'
    }
  | {
      type: 'question-succeeded'
      answer: AiQueryAnswer
    }
  | {
      type: 'question-failed'
      message: string
    }
