/** Trim and cap free-text fields to reduce XSS / oversized payload risk. */
export function sanitizeText(value, maxLen = 500) {
  if (value == null) return null;
  const s = String(value).trim().slice(0, maxLen);
  return s.replace(/[<>]/g, '');
}

export function sanitizeUserInput(body, fields) {
  const out = { ...body };
  for (const field of fields) {
    if (out[field] != null) out[field] = sanitizeText(out[field]);
  }
  return out;
}
