import * as  z from 'zod'

const reportSourceMetadataSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  system: z.enum(['quickbooks-report', 'rootfi-periods']),
  reportName: z.string(),
  periodStart: z.string().nullable(),
  periodEnd: z.string().nullable(),
  currency: z.string(),
  rowsImported: z.number(),
  periodsImported: z.number(),
})

const reportPeriodSchema = z.object({
  id: z.string(),
  label: z.string(),
  startsOn: z.string(),
  endsOn: z.string(),
})

const profitAndLossRowSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  parentId: z.string().nullable(),
  label: z.string(),
  kind: z.enum(['section', 'account', 'metric']),
  depth: z.number(),
  sortOrder: z.number(),
  values: z.record(z.string(), z.number()),
  sourceRef: z
    .object({
      externalId: z.string().optional(),
      group: z.string().optional(),
    })
    .optional(),
})

export const unifiedProfitAndLossReportSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['empty', 'integrated', 'failed']),
  generatedAt: z.string().nullable(),
  currency: z.string(),
  sources: z.array(reportSourceMetadataSchema),
  periods: z.array(reportPeriodSchema),
  rows: z.array(profitAndLossRowSchema),
})

export const integrationSummarySchema = z.object({
  status: z.literal('completed'),
  reportId: z.string(),
  sources: z.array(reportSourceMetadataSchema),
  periodCount: z.number(),
  rowCount: z.number(),
})
