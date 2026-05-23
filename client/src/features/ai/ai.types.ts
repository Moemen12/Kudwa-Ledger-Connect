export type AiInsight = {
  title: string
  body: string
  severity: 'info' | 'positive' | 'warning'
  evidence: AiEvidence
}

export type AiEvidence = {
  periodLabel?: string
  rowLabel?: string
  value?: number
}

export type AiInsightsResult = {
  status: 'fallback' | 'generated' | 'unavailable'
  generatedAt: string
  model: string | null
  insights: AiInsight[]
}

export type AiQueryAnswer = {
  status: 'fallback' | 'generated' | 'unavailable'
  generatedAt: string
  model: string | null
  question: string
  answer: string
  evidence: AiEvidence[]
}
