import { z } from 'zod';

// ── Schema Definitions ────────────────────────────────────────────────────────

export const DiseasePredictionSchema = z.object({
  prediction: z.string(),
  disease: z.string(),
  advice: z.string().default(''),
  severity: z.enum(['P1', 'P2', 'P3', 'P4']).default('P3'),
  doctor_specialty: z.string().default('General Physician'),
  confidence: z.number().min(0).max(1),
  alternatives: z.array(z.object({
    disease: z.string(),
    confidence: z.number()
  })).default([]),
  model: z.string().default('Hybrid Model'),
  accuracy: z.string().default('N/A')
});

export const PregnancyRiskSchema = z.object({
  risk_level: z.string(),
  vector_score: z.number().default(0),
  factors_assessed: z.array(z.string()).default([])
});

export const MalnutritionSchema = z.object({
  status: z.string(),
  bmi: z.number().default(0),
  action: z.string().default('')
});

export const RagChatSchema = z.object({
  reply: z.string(),
  sources: z.array(z.string()).default([])
});

export const SeasonalRiskSchema = z.object({
  villageId: z.string(),
  month: z.string(),
  risk_level: z.string(),
  top_diseases: z.array(z.string()).default([]),
  preventive_measures: z.array(z.string()).default([])
});

// ── Error Taxonomy & Helper ──────────────────────────────────────────────────

export class AIServiceError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'AIServiceError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Validates data against a Zod schema. Throws AIServiceError on mismatch.
 */
export function validateAiOutput(schema, data, errorMsg = 'AI Output mismatch') {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AIServiceError(
      'AI_OUTPUT_VALIDATION_FAILED',
      `${errorMsg}: ${result.error.message}`,
      { errors: result.error.errors, rawData: data }
    );
  }
  return result.data;
}
