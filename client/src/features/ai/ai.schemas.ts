import * as  z from 'zod'

const aiEvidenceSchema = z.object({
  periodLabel: z.string().optional(),
  rowLabel: z.string().optional(),
  value: z.number().optional(),
})

export const aiInsightsResultSchema = z.object({
  status: z.enum(['fallback', 'generated', 'unavailable']),
  generatedAt: z.string(),
  model: z.string().nullable(),
  insights: z.array(
    z.object({
      title: z.string(),
      body: z.string(),
      severity: z.enum(['info', 'positive', 'warning']),
      evidence: aiEvidenceSchema,
    }),
  ),
})

export const aiQueryAnswerSchema = z.object({
  status: z.enum(['fallback', 'generated', 'unavailable']),
  generatedAt: z.string(),
  model: z.string().nullable(),
  question: z.string(),
  answer: z.string(),
  evidence: z.array(aiEvidenceSchema),
})
