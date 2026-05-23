import type { AiEvidence, AiInsight, AiQueryAnswer } from './ai.types';

export function parseInsightsResponse(text: string | undefined): AiInsight[] {
  const parsed = parseJsonObject(text);

  if (!parsed || !Array.isArray(parsed.insights)) {
    return [];
  }

  return parsed.insights
    .map((insight) => normalizeInsight(insight))
    .filter((insight): insight is AiInsight => Boolean(insight))
    .slice(0, 3);
}

export function parseQueryResponse(
  text: string | undefined,
  question: string,
): Omit<AiQueryAnswer, 'generatedAt' | 'model' | 'status'> {
  const parsed = parseJsonObject(text);

  if (!parsed || typeof parsed.answer !== 'string') {
    return {
      answer: 'I could not produce a grounded answer from the report data.',
      evidence: [],
      question,
    };
  }

  return {
    answer: parsed.answer,
    evidence: Array.isArray(parsed.evidence)
      ? parsed.evidence
          .map((evidence) => normalizeEvidence(evidence))
          .filter((evidence): evidence is AiEvidence => Boolean(evidence))
      : [],
    question,
  };
}

function parseJsonObject(
  text: string | undefined,
): Record<string, unknown> | null {
  if (!text) {
    return null;
  }

  const jsonText = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  const parsed: unknown = JSON.parse(jsonText);

  return typeof parsed === 'object' && parsed !== null
    ? (parsed as Record<string, unknown>)
    : null;
}

function normalizeInsight(insight: unknown): AiInsight | null {
  if (typeof insight !== 'object' || insight === null) {
    return null;
  }

  const source = insight as Record<string, unknown>;
  const severity = source.severity;

  return {
    body: typeof source.body === 'string' ? source.body : '',
    evidence: normalizeEvidence(source.evidence) ?? {},
    severity:
      severity === 'positive' || severity === 'warning' ? severity : 'info',
    title: typeof source.title === 'string' ? source.title : 'Report insight',
  };
}

function normalizeEvidence(evidence: unknown): AiEvidence | null {
  if (typeof evidence !== 'object' || evidence === null) {
    return null;
  }

  const source = evidence as Record<string, unknown>;

  return {
    periodLabel:
      typeof source.periodLabel === 'string' ? source.periodLabel : undefined,
    rowLabel: typeof source.rowLabel === 'string' ? source.rowLabel : undefined,
    value: typeof source.value === 'number' ? source.value : undefined,
  };
}
