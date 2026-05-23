import { useState } from 'react'
import { MessageSquareText, Sparkles } from 'lucide-react'
import {
  isActionableLedgerReportQuestion,
  type AiEvidence,
  type AiInsight,
} from '@/features/ai'
import { formatCurrency, type ProfitAndLossRow } from '@/features/ledger'
import { Button } from '@/presentation/components/ui/button'
import { useLedgerInsights } from '../hooks/useLedgerInsights'

type LedgerInsightsPanelProps = {
  accountRows: ProfitAndLossRow[]
  currency: string
  hasIntegratedReport: boolean
}

export function LedgerInsightsPanel({
  accountRows,
  currency,
  hasIntegratedReport,
}: LedgerInsightsPanelProps) {
  const [question, setQuestion] = useState('')
  const {
    askQuestion,
    generateInsights,
    insights,
    insightsErrorMessage,
    insightsResult,
    insightsStatus,
    queryAnswer,
    queryErrorMessage,
    queryStatus,
  } = useLedgerInsights()
  const isGeneratingInsights = insightsStatus === 'running'
  const isAnsweringQuestion = queryStatus === 'running'
  const accountLabels = accountRows.map((row) => row.label)
  const isReportQuestion = isActionableLedgerReportQuestion(
    question,
    accountLabels,
  )
  const canAskQuestion =
    hasIntegratedReport && question.trim().length > 0 && isReportQuestion

  const handleQuestionSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!canAskQuestion || isAnsweringQuestion) {
      return
    }

    void askQuestion(question)
  }

  return (
    <section className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-teal-700" aria-hidden="true" />
              <h2 className="text-base font-semibold text-slate-950">
                AI financial insights
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Generate concise observations grounded in the integrated report.
            </p>
          </div>

          <Button
            className="w-full sm:w-auto"
            disabled={!hasIntegratedReport || isGeneratingInsights}
            onClick={() => void generateInsights()}
          >
            {isGeneratingInsights ? 'Generating...' : 'Generate insights'}
          </Button>
        </div>

        {insightsErrorMessage ? (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {insightsErrorMessage}
          </p>
        ) : null}

        {insightsResult ? (
          <p className="mt-3 text-xs text-slate-500">
            {getStatusMessage(insightsResult.status, insightsResult.model)}
          </p>
        ) : null}

        {insights.length > 0 ? (
          <div className="mt-4 grid gap-3">
            {insights.map((insight) => (
              <InsightCard
                currency={currency}
                insight={insight}
                key={`${insight.title}-${insight.evidence.rowLabel ?? ''}`}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <MessageSquareText
            className="size-4 text-teal-700"
            aria-hidden="true"
          />
          <h2 className="text-base font-semibold text-slate-950">
            Ask the report
          </h2>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Ask questions like “What was total profit in Q1?”
        </p>

        <form className="mt-3 grid gap-2" onSubmit={handleQuestionSubmit}>
          <textarea
            className="min-h-24 resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-5 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
            disabled={!hasIntegratedReport || isAnsweringQuestion}
            maxLength={500}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="What was total profit in Q1?"
            value={question}
          />
          <Button disabled={!canAskQuestion || isAnsweringQuestion}>
            {isAnsweringQuestion ? 'Answering...' : 'Ask question'}
          </Button>
        </form>

        {question.trim().length > 0 && !isReportQuestion ? (
          <p className="mt-2 text-xs text-amber-700">
            Ask a clearer report question with a metric and period, like “What was income in Q1?”
          </p>
        ) : null}

        {queryErrorMessage ? (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {queryErrorMessage}
          </p>
        ) : null}

        {queryAnswer ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm leading-5 text-slate-700">
              {queryAnswer.answer}
            </p>
            <EvidenceList currency={currency} evidence={queryAnswer.evidence} />
            <p className="mt-3 text-xs text-slate-500">
              {getStatusMessage(queryAnswer.status, queryAnswer.model)}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function InsightCard({
  currency,
  insight,
}: {
  currency: string
  insight: AiInsight
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <span className={`text-xs font-semibold ${getSeverityClassName(insight)}`}>
        {insight.severity}
      </span>
      <h3 className="mt-1 text-sm font-semibold text-slate-950">
        {insight.title}
      </h3>
      <p className="mt-1 text-sm leading-5 text-slate-600">{insight.body}</p>
      {insight.evidence.rowLabel ? (
        <p className="mt-3 text-xs text-slate-500">
          {insight.evidence.rowLabel}
          {insight.evidence.periodLabel ? ` · ${insight.evidence.periodLabel}` : ''}
          {typeof insight.evidence.value === 'number'
            ? ` · ${formatCurrency(insight.evidence.value, currency)}`
            : ''}
        </p>
      ) : null}
    </article>
  )
}

function EvidenceList({
  currency,
  evidence,
}: {
  currency: string
  evidence: AiEvidence[]
}) {
  if (evidence.length === 0) {
    return null
  }

  return (
    <ul className="mt-3 grid gap-1 text-xs text-slate-500">
      {evidence.slice(0, 6).map((item) => (
        <li key={`${item.rowLabel ?? 'row'}-${item.periodLabel ?? 'period'}`}>
          {item.rowLabel ?? 'Report row'}
          {item.periodLabel ? ` · ${item.periodLabel}` : ''}
          {typeof item.value === 'number'
            ? ` · ${formatCurrency(item.value, currency)}`
            : ''}
        </li>
      ))}
    </ul>
  )
}

function getSeverityClassName(insight: AiInsight) {
  if (insight.severity === 'positive') {
    return 'text-emerald-700'
  }

  if (insight.severity === 'warning') {
    return 'text-amber-700'
  }

  return 'text-slate-500'
}

function getStatusMessage(status: string, model: string | null) {
  if (status === 'generated') {
    return `Generated with ${model}.`
  }

  if (status === 'fallback') {
    return 'Showing deterministic local output because AI is not configured or unavailable.'
  }

  return 'AI output is unavailable until integration runs.'
}
