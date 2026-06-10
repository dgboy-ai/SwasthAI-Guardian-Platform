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

export const PregnancyRiskFactorSchema = z.object({
  name: z.string(),
  weight: z.number(),
  status: z.enum(['low', 'medium', 'high']),
  trend: z.enum(['up', 'down', 'stable']).default('stable'),
  advice: z.string()
});

export const PregnancyRiskSchema = z.object({
  risk_level: z.string(),
  vector_score: z.number().default(0),
  factors_assessed: z.array(z.string()).default([]),
  factors: z.array(PregnancyRiskFactorSchema).default([])
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

/**
 * Checks query string against safety guardrails (length, gibberish, prompt injection).
 * Returns a safety error payload if a guardrail triggers, or null if the text is clean.
 */
export function checkTextGuardrails(text) {
  const msg = (text || '').trim();
  if (!msg) return null;

  // 1. Length guardrail
  if (msg.length > 400) {
    return {
      reply: "I can only process messages up to 400 characters. Please simplify your question. / मैं केवल 400 अक्षरों तक के संदेशों को समझ सकती हूँ। कृपया अपना प्रश्न छोटा करें।",
      sources: ["Sakhi Health Assistant — General Information"],
      urgency: "P4",
      grounded: false
    };
  }

  const textLower = msg.toLowerCase();

  // 2. Gibberish guardrail
  let isGibberish = false;

  // repeating characters: 4 or more times
  if (/(.)\1{3,}/i.test(textLower)) {
    isGibberish = true;
  }

  // sequential layouts
  const gibberishPatterns = [
    'asdfgh', 'qwerty', 'zxcvbn', '123456', 'qwert', 'asdfg', 'zxcvb',
    'jklsem', 'mnbvc', 'lkjhg', 'poiuy'
  ];
  for (const pattern of gibberishPatterns) {
    if (textLower.includes(pattern)) {
      isGibberish = true;
    }
  }

  // English words > 3 chars with no vowels
  const words = textLower.match(/[a-zA-Z]+/g) || [];
  for (const w of words) {
    if (w.length > 3) {
      if (!/[aeiouy]/i.test(w)) {
        isGibberish = true;
      }
    }
  }

  // spammed repeated words
  const allWords = textLower.match(/\b\w+\b/g) || [];
  if (allWords.length > 5) {
    const counts = {};
    for (const w of allWords) {
      counts[w] = (counts[w] || 0) + 1;
    }
    const maxCount = Math.max(...Object.values(counts));
    if (maxCount > 4) {
      isGibberish = true;
    }
  }

  if (isGibberish) {
    return {
      reply: "Hello! I am Sakhi. Please ask a valid health question about pregnancy care, menstrual hygiene, periods, or child health. / नमस्ते! मैं सखी हूँ। कृपया गर्भावस्था, पीरियड्स, या बाल स्वास्थ्य के बारे में एक सही सवाल पूछें।",
      sources: ["Sakhi Health Assistant — General Information"],
      urgency: "P4",
      grounded: false
    };
  }

  // 3. Prompt injection guardrail
  const injectionKeywords = [
    "ignore previous", "ignore all instructions", "system prompt", "you are now", 
    "bypass", "developer mode", "override instruction", "dan mode"
  ];
  const isInjection = injectionKeywords.some(kw => textLower.includes(kw));
  if (isInjection) {
    return {
      reply: "Hello! I am Sakhi, a dedicated assistant for women's and family health. I cannot process instructions to change my settings. How can I help you with your health today? / नमस्ते! मैं सखी हूँ, महिलाओं और बच्चों के स्वास्थ्य के लिए समर्पित। मैं नियमों को बदलने का निर्देश स्वीकार नहीं कर सकती।",
      sources: ["Sakhi Health Assistant — General Information"],
      urgency: "P4",
      grounded: false
    };
  }

  return null;
}
