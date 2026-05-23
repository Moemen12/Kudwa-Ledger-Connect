import { AiGeminiService } from './ai-gemini.service';
import { AiQuestionService } from './ai-question.service';
import { AiReportContextService } from './ai-report-context.service';
import type { AiReportContext } from './ai.types';

const periods = [
  {
    id: 'jan-2025',
    label: 'Jan 2025',
    startsOn: '2025-01-01',
    endsOn: '2025-01-31',
  },
  {
    id: 'feb-2025',
    label: 'Feb 2025',
    startsOn: '2025-02-01',
    endsOn: '2025-02-28',
  },
  {
    id: 'mar-2025',
    label: 'Mar 2025',
    startsOn: '2025-03-01',
    endsOn: '2025-03-31',
  },
  {
    id: 'apr-2025',
    label: 'Apr 2025',
    startsOn: '2025-04-01',
    endsOn: '2025-04-30',
  },
  {
    id: 'may-2025',
    label: 'May 2025',
    startsOn: '2025-05-01',
    endsOn: '2025-05-31',
  },
  {
    id: 'jun-2025',
    label: 'Jun 2025',
    startsOn: '2025-06-01',
    endsOn: '2025-06-30',
  },
];

const context: AiReportContext = {
  periods,
  report: {
    currency: 'USD',
    generatedAt: '2026-05-23T00:00:00.000Z',
    id: 'report',
    name: 'Test P&L',
    periods,
    rows: [],
    sources: [],
    status: 'integrated',
  },
  rows: [
    {
      depth: 0,
      id: 'gross-profit',
      kind: 'metric',
      label: 'Gross Profit',
      parentId: null,
      sortOrder: 1,
      sourceId: 'test',
      values: {
        'jan-2025': 10,
        'feb-2025': 20,
        'mar-2025': 30,
      },
    },
    {
      depth: 0,
      id: 'net-income',
      kind: 'metric',
      label: 'Net Income',
      parentId: null,
      sortOrder: 2,
      sourceId: 'test',
      values: {
        'jan-2025': -100,
        'feb-2025': -200,
        'mar-2025': -300,
      },
    },
    {
      depth: 0,
      id: 'expenses',
      kind: 'section',
      label: 'Expenses',
      parentId: null,
      sortOrder: 3,
      sourceId: 'test',
      values: {
        'apr-2025': 1000,
        'may-2025': 2000,
        'jun-2025': 3000,
      },
    },
  ],
};

describe('AiQuestionService', () => {
  let service: AiQuestionService;
  let geminiService: jest.Mocked<Pick<AiGeminiService, 'hasApiKey'>>;

  beforeEach(() => {
    geminiService = {
      hasApiKey: jest.fn().mockReturnValue(false),
    };
    service = new AiQuestionService(
      geminiService as unknown as AiGeminiService,
      new AiReportContextService(),
    );
  });

  it('maps ambiguous total profit to Gross Profit in deterministic fallback', async () => {
    const answer = await service.answer(
      context,
      'What was total profit in Q1?',
    );

    expect(answer.status).toBe('fallback');
    expect(answer.answer).toBe('Gross Profit for Q1 was $60.');
    expect(answer.evidence).toEqual([
      { periodLabel: 'Jan 2025', rowLabel: 'Gross Profit', value: 10 },
      { periodLabel: 'Feb 2025', rowLabel: 'Gross Profit', value: 20 },
      { periodLabel: 'Mar 2025', rowLabel: 'Gross Profit', value: 30 },
    ]);
  });

  it('keeps net income distinct from total profit', async () => {
    const answer = await service.answer(context, 'What was net income in Q1?');

    expect(answer.answer).toBe('Net Income for Q1 was -$600.');
    expect(answer.evidence.map((item) => item.rowLabel)).toEqual([
      'Net Income',
      'Net Income',
      'Net Income',
    ]);
  });

  it('sums period evidence when asked about quarter expenses', async () => {
    const answer = await service.answer(context, 'What were expenses in Q2?');

    expect(answer.answer).toBe('Expenses for Q2 was $6,000.');
    expect(answer.evidence).toEqual([
      { periodLabel: 'Apr 2025', rowLabel: 'Expenses', value: 1000 },
      { periodLabel: 'May 2025', rowLabel: 'Expenses', value: 2000 },
      { periodLabel: 'Jun 2025', rowLabel: 'Expenses', value: 3000 },
    ]);
  });
});
