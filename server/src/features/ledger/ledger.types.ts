export type ReportStatus = 'empty' | 'integrated' | 'failed';

export type ReportSourceSystem = 'quickbooks-report' | 'rootfi-periods';

export type ReportSourceMetadata = {
  id: string;
  fileName: string;
  system: ReportSourceSystem;
  reportName: string;
  periodStart: string | null;
  periodEnd: string | null;
  currency: string;
  rowsImported: number;
  periodsImported: number;
};

export type ReportPeriod = {
  id: string;
  label: string;
  startsOn: string;
  endsOn: string;
};

export type ProfitAndLossRow = {
  id: string;
  sourceId: string;
  parentId: string | null;
  label: string;
  kind: 'section' | 'account' | 'metric';
  depth: number;
  sortOrder: number;
  values: Record<string, number>;
  sourceRef?: {
    externalId?: string;
    group?: string;
  };
};

export type UnifiedProfitAndLossReport = {
  id: string;
  name: string;
  status: ReportStatus;
  generatedAt: string | null;
  currency: string;
  sources: ReportSourceMetadata[];
  periods: ReportPeriod[];
  rows: ProfitAndLossRow[];
};

export type IntegrationSummary = {
  status: 'completed';
  reportId: string;
  sources: ReportSourceMetadata[];
  periodCount: number;
  rowCount: number;
};
