import { askLedgerQuestion, fetchLedgerInsights } from './ai.api'

export async function generateLedgerInsights() {
  return fetchLedgerInsights()
}

export async function answerLedgerQuestion(question: string) {
  return askLedgerQuestion(question)
}
