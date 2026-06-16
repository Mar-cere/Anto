/**
 * Filtros de contenido clínico / citas largas (#208 / #212).
 */
export const FORBIDDEN_CLINICAL_PATTERNS = [
  /\bdiagn[oó]stic/i,
  /\bdepresi[oó]n\b/i,
  /\bansiedad\s+generalizada\b/i,
  /\btrastorno\b/i,
  /\bmedicaci[oó]n\b/i,
  /\bpsic[oó]tico\b/i,
  /\btienes\s+(un|una)\b/i,
  /\best[aá]s\s+deprimid/i,
  /\bsuicid/i,
  /«[^»]{20,}»/,
  /"[^"]{20,}"/,
];

export function failsClinicalGuardrails(text) {
  const raw = String(text || '');
  return FORBIDDEN_CLINICAL_PATTERNS.some((re) => re.test(raw));
}

export function sanitizeObservationalText(text, max = 200) {
  const t = String(text || '').trim();
  if (!t || failsClinicalGuardrails(t)) return null;
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

export function sanitizeObservationalSamples(samples = [], maxItems = 3, maxLen = 100) {
  if (!Array.isArray(samples)) return [];
  return samples
    .map((s) => sanitizeObservationalText(s, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
}

export default {
  FORBIDDEN_CLINICAL_PATTERNS,
  failsClinicalGuardrails,
  sanitizeObservationalText,
  sanitizeObservationalSamples,
};
