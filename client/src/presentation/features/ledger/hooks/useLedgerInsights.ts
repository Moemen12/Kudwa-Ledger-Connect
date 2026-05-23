import { useCallback, useReducer } from 'react'
import { answerLedgerQuestion, generateLedgerInsights } from '@/features/ai'
import type {
  LedgerInsightsAction,
  LedgerInsightsState,
} from './useLedgerInsights.types'

const initialState: LedgerInsightsState = {
  insightsErrorMessage: null,
  insightsResult: null,
  insightsStatus: 'idle',
  queryAnswer: null,
  queryErrorMessage: null,
  queryStatus: 'idle',
}

export function useLedgerInsights() {
  const [state, dispatch] = useReducer(ledgerInsightsReducer, initialState)

  const generateInsights = useCallback(async () => {
    dispatch({ type: 'generation-started' })

    try {
      const result = await generateLedgerInsights()
      dispatch({ type: 'generation-succeeded', result })
    } catch (error) {
      dispatch({ type: 'generation-failed', message: getErrorMessage(error) })
    }
  }, [])

  const askQuestion = useCallback(async (question: string) => {
    dispatch({ type: 'question-started' })

    try {
      const answer = await answerLedgerQuestion(question)
      dispatch({ type: 'question-succeeded', answer })
    } catch (error) {
      dispatch({ type: 'question-failed', message: getErrorMessage(error) })
    }
  }, [])

  return {
    askQuestion,
    insightsErrorMessage: state.insightsErrorMessage,
    generateInsights,
    insights: state.insightsResult?.insights ?? [],
    insightsResult: state.insightsResult,
    insightsStatus: state.insightsStatus,
    queryAnswer: state.queryAnswer,
    queryErrorMessage: state.queryErrorMessage,
    queryStatus: state.queryStatus,
  }
}

function ledgerInsightsReducer(
  state: LedgerInsightsState,
  action: LedgerInsightsAction,
): LedgerInsightsState {
  switch (action.type) {
    case 'generation-started':
      return {
        ...state,
        insightsErrorMessage: null,
        insightsStatus: 'running',
      }
    case 'generation-succeeded':
      return {
        ...state,
        insightsErrorMessage: null,
        insightsResult: action.result,
        insightsStatus: 'succeeded',
      }
    case 'generation-failed':
      return {
        ...state,
        insightsErrorMessage: action.message,
        insightsStatus: 'failed',
      }
    case 'question-started':
      return {
        ...state,
        queryErrorMessage: null,
        queryStatus: 'running',
      }
    case 'question-succeeded':
      return {
        ...state,
        queryAnswer: action.answer,
        queryErrorMessage: null,
        queryStatus: 'succeeded',
      }
    case 'question-failed':
      return {
        ...state,
        queryErrorMessage: action.message,
        queryStatus: 'failed',
      }
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.'
}
