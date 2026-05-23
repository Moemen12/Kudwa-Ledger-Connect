import type {
  ProfitAndLossRow,
  ReportPeriod,
  UnifiedProfitAndLossReport,
} from '../ledger/ledger.types';

export type AiInsight = {
  title: string;
  body: string;
  severity: 'info' | 'positive' | 'warning';
  evidence: AiEvidence;
};

export type AiEvidence = {
  periodLabel?: string;
  rowLabel?: string;
  value?: number;
};

export type AiInsightsResult = {
  status: 'fallback' | 'generated' | 'unavailable';
  generatedAt: string;
  model: string | null;
  insights: AiInsight[];
};

export type AiQueryAnswer = {
  status: 'fallback' | 'generated' | 'unavailable';
  generatedAt: string;
  model: string | null;
  question: string;
  answer: string;
  evidence: AiEvidence[];
};

export type ReportSnapshotRow = {
  label: string;
  values: Array<{
    label: string;
    value: number;
  }>;
};

export type ReportSnapshot = {
  currency: string;
  generatedAt: string | null;
  periods: string[];
  reportName: string;
  rows: ReportSnapshotRow[];
};

export type ReportValuePoint = {
  period: ReportPeriod;
  value: number;
};

export type AiReportContext = {
  report: UnifiedProfitAndLossReport;
  rows: ProfitAndLossRow[];
  periods: ReportPeriod[];
};
