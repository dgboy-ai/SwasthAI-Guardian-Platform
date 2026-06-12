/**
 * Frontend PII Redactor Utility.
 * Intercepts user messages and redacts PII before sending them to external LLMs.
 */

export function redactPII(text) {
  if (typeof text !== 'string') return text;
  
  let redacted = text;

  // 1. Redact Aadhaar Card Numbers (12-digit number with spaces or hyphens)
  // Format: XXXX XXXX XXXX or XXXXXXXXXXXX
  const aadhaarRegex = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;
  redacted = redacted.replace(aadhaarRegex, '[AADHAAR REDACTED]');

  // 2. Redact Phone Numbers (10-digit Indian phone numbers with optional country code)
  // Format: +91-XXXXX-XXXXX, +91XXXXXXXXXX, XXXXXXXXXX
  const phoneRegex = /(?:\+91[\-\s]?)?[6-9]\d{9}\b/g;
  redacted = redacted.replace(phoneRegex, '[PHONE REDACTED]');

  // 3. Redact Email Addresses
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  redacted = redacted.replace(emailRegex, '[EMAIL REDACTED]');

  // 4. Redact English Name Patterns ("my name is X", "i am Y")
  const namePatterns = [
    { regex: /\bmy name is\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)\b/gi, replacement: 'my name is [NAME REDACTED]' },
    { regex: /\bi am\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)\b/gi, replacement: 'i am [NAME REDACTED]' },
    { regex: /\bनाम\s+(?:है\s+)?([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+)?)\b/gi, replacement: 'नाम [NAME REDACTED]' }
  ];

  namePatterns.forEach(({ regex, replacement }) => {
    redacted = redacted.replace(regex, replacement);
  });

  // 5. Redact Hindi Name Patterns ("मेरा नाम X है", "मैं Y हूँ")
  const hindiNameIsRegex = /(?:मेरा नाम|मेेरा नाम)\s+([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+)?)(?:\s+है)?/gi;
  redacted = redacted.replace(hindiNameIsRegex, (match, name) => {
    return match.replace(name, '[NAME REDACTED]');
  });

  const hindiIamRegex = /(?:मैं|मै)\s+([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+)?)(?:\s+(?:हूँ|हूँ |हुँ|हू|हूं))?/gi;
  redacted = redacted.replace(hindiIamRegex, (match, name) => {
    const commonExcludes = ['ठीक', 'बीमार', 'गर्भवती', 'परेशान', 'आशा', 'डॉक्टर', 'मरीज', 'पीड़ित'];
    if (commonExcludes.includes(name.trim())) {
      return match;
    }
    return match.replace(name, '[NAME REDACTED]');
  });

  return redacted;
}
