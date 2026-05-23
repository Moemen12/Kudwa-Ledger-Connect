import {
  REPORT_INTENT_KEYWORDS,
  REPORT_SUBJECT_KEYWORDS,
} from './ai-query-intent'

export function isActionableLedgerReportQuestion(
  question: string,
  accountLabels: string[],
) {
  const normalizedQuestion = normalizeText(question)
  const subjectMatches =
    REPORT_SUBJECT_KEYWORDS.some((keyword) =>
      normalizedQuestion.includes(keyword),
    ) ||
    accountLabels.some((label) => {
      const normalizedLabel = normalizeText(label)

      return (
        normalizedLabel.length > 2 &&
        normalizedQuestion.includes(normalizedLabel)
      )
    })
  const intentMatches = REPORT_INTENT_KEYWORDS.some((keyword) =>
    normalizedQuestion.includes(keyword),
  )

  return subjectMatches && intentMatches
}

function normalizeText(value: string) {
  return value.toLowerCase().replaceAll(/\s+/g, ' ').trim()
}
