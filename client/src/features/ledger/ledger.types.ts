export type IntegrationStatus = 'idle' | 'running' | 'succeeded' | 'failed'

export type ReportSourceMetadata = {
  id: string
  fileName: string
  system: 'quickbooks-report' | 'rootfi-periods'
  reportName: string
  periodStart: string | null
  periodEnd: string | null
  currency: string
  rowsImported: number
  periodsImported: number
}

export type ReportPeriod = {
  id: string
  label: string
  startsOn: string
  endsOn: string
}

export type ProfitAndLossRow = {
  id: string
  sourceId: string
  parentId: string | null
  label: string
  kind: 'section' | 'account' | 'metric'
  depth: number
  sortOrder: number
  values: Record<string, number>
  sourceRef?: {
    externalId?: string
    group?: string
  }
}

export type UnifiedProfitAndLossReport = {
  id: string
  name: string
  status: 'empty' | 'integrated' | 'failed'
  generatedAt: string | null
  currency: string
  sources: ReportSourceMetadata[]
  periods: ReportPeriod[]
  rows: ProfitAndLossRow[]
}

export type IntegrationSummary = {
  status: 'completed'
  reportId: string
  sources: ReportSourceMetadata[]
  periodCount: number
  rowCount: number
}

export type ReportTrendPoint = {
  hasValue: boolean
  periodId: string
  label: string
  value: number
}

export type ReportKpi = {
  sourceRowLabel: string
  id: string
  label: string
  valuePeriodLabel: string | null
  value: number
  changePercent: number | null
  direction: 'down' | 'flat' | 'up'
  tone: 'danger' | 'success'
  trend: ReportTrendPoint[]
}
