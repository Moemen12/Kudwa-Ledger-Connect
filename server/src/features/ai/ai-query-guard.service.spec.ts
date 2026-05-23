import type { ProfitAndLossRow } from '../ledger/ledger.types';
import { AiQueryGuardService } from './ai-query-guard.service';

function row(label: string): ProfitAndLossRow {
  return {
    depth: 0,
    id: label,
    kind: 'account',
    label,
    parentId: null,
    sortOrder: 0,
    sourceId: 'test',
    values: {},
  };
}

describe('AiQueryGuardService', () => {
  const rows = [
    row('Income'),
    row('Expenses'),
    row('Gross Profit'),
    row('Net Income'),
  ];
  let service: AiQueryGuardService;

  beforeEach(() => {
    service = new AiQueryGuardService();
  });

  it('blocks greetings and unclear metric mentions before Gemini', () => {
    expect(service.isActionableReportQuestion('hello', rows)).toBe(false);
    expect(service.isActionableReportQuestion('hello income', rows)).toBe(
      false,
    );
    expect(service.isActionableReportQuestion('income', rows)).toBe(false);
  });

  it('allows report questions with both subject and intent', () => {
    expect(
      service.isActionableReportQuestion('what was income in q1', rows),
    ).toBe(true);
    expect(
      service.isActionableReportQuestion('compare expenses by month', rows),
    ).toBe(true);
    expect(
      service.isActionableReportQuestion('highest gross profit', rows),
    ).toBe(true);
  });

  it('returns a clarifying answer for blocked questions', () => {
    const answer = service.getClarifyingQuestionAnswer('hello income');

    expect(answer.answer).toContain('clearer question');
    expect(answer.evidence).toEqual([]);
    expect(answer.model).toBeNull();
    expect(answer.question).toBe('hello income');
    expect(answer.status).toBe('unavailable');
  });
});
