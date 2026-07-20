/**
 * Narrativa LLM para informes semanal/mensual (#208) con guardrails clínicos.
 */
import openaiService from './openaiService.js';
import { sanitizeObservationalText } from '../utils/clinicalContentGuardrails.js';
import { buildObservationalFidelitySnippet } from './chat/observationalFidelitySnippet.js';

const MANDATORY_DISCLAIMER_ES = [
  'Correlaciones observacionales, no causas ni diagnósticos.',
  'Anto no sustituye atención clínica; busca apoyo profesional si lo necesitas.',
];
const MANDATORY_DISCLAIMER_EN = [
  'Observational correlations, not causes or diagnoses.',
  'Anto is not a substitute for clinical care; seek professional support if you need it.',
];

export function isWeeklyInsightLlmEnabled() {
  return (
    process.env.WEEKLY_INSIGHT_LLM_ENABLED === 'true' && Boolean(process.env.OPENAI_API_KEY)
  );
}

function sanitizeInsightRow(row) {
  if (!row || typeof row !== 'object') return null;
  const label = sanitizeObservationalText(row.label, 120);
  const detail = sanitizeObservationalText(row.detail, 500);
  if (!label && !detail) return null;
  return {
    type: String(row.type || 'insight').slice(0, 48),
    label: label || '',
    detail: detail || '',
    strength: typeof row.strength === 'number' ? row.strength : undefined,
    disclaimer: 'pattern_observed',
  };
}

export function validateLlmInsightPayload(parsed, { language = 'es' } = {}) {
  if (!parsed || typeof parsed !== 'object') return null;
  const lang = language === 'en' ? 'en' : 'es';
  const headline = sanitizeObservationalText(parsed.headline, 160);
  if (!headline) return null;

  const insights = (Array.isArray(parsed.insights) ? parsed.insights : [])
    .map((row) => sanitizeInsightRow(row))
    .filter((row) => row && (row.label || row.detail))
    .slice(0, 6);

  if (insights.length === 0) return null;

  let conductSuggestion = parsed.conductSuggestion;
  if (conductSuggestion != null) {
    conductSuggestion = sanitizeObservationalText(conductSuggestion, 280);
  } else {
    conductSuggestion = null;
  }

  const mandatory = lang === 'en' ? MANDATORY_DISCLAIMER_EN : MANDATORY_DISCLAIMER_ES;
  const extra = (Array.isArray(parsed.disclaimers) ? parsed.disclaimers : [])
    .map((d) => sanitizeObservationalText(d, 200))
    .filter(Boolean);
  const disclaimers = [...new Set([...mandatory, ...extra])].slice(0, 5);

  return {
    headline,
    insights,
    conductSuggestion,
    disclaimers,
    body: conductSuggestion || '',
  };
}

function buildCorrelationDigest(correlations, language) {
  const lang = language === 'en' ? 'en' : 'es';
  return (correlations || [])
    .slice(0, 8)
    .map((row, i) => {
      const type = row?.type || 'pattern';
      const label = row?.sourceLabel || row?.sourceId || row?.interventionLabel || '';
      const target = row?.interventionLabel || row?.targetId || '';
      const strength = typeof row?.strength === 'number' ? row.strength.toFixed(2) : '';
      return lang === 'en'
        ? `${i + 1}. [${type}] ${label} → ${target} (strength ${strength})`
        : `${i + 1}. [${type}] ${label} → ${target} (fuerza ${strength})`;
    })
    .join('\n');
}

function buildPhenotypeDigest(sourceSummary, language) {
  const lang = language === 'en' ? 'en' : 'es';
  const days = Number(sourceSummary?.phenotypeDaysWithData || 0);
  if (days < 1) {
    return lang === 'en' ? 'No digital health aggregates this period.' : 'Sin agregados de salud digital en el periodo.';
  }
  const sleep = sourceSummary?.avgSleepHours;
  const steps = sourceSummary?.avgSteps;
  const screen = sourceSummary?.avgScreenMinutes;
  const active = sourceSummary?.avgActiveMinutes;
  const parts = [];
  if (Number.isFinite(sleep)) parts.push(lang === 'en' ? `avg sleep ${sleep}h` : `sueño prom ${sleep}h`);
  if (Number.isFinite(steps)) parts.push(lang === 'en' ? `avg steps ${steps}` : `pasos prom ${steps}`);
  if (Number.isFinite(active)) parts.push(lang === 'en' ? `active min ${active}` : `min activos ${active}`);
  if (Number.isFinite(screen)) parts.push(lang === 'en' ? `screen ${screen}min` : `pantalla ${screen}min`);
  return `${lang === 'en' ? 'Digital health' : 'Salud digital'} (${days}d): ${parts.join(', ')}`;
}

/**
 * @param {object} basePayload — salida heurística de buildPatternInsightPayload
 */
export async function enrichPatternInsightWithLlm({
  basePayload,
  correlations = [],
  language = 'es',
  periodKind = 'week',
}) {
  if (!isWeeklyInsightLlmEnabled() || !basePayload) {
    return basePayload;
  }

  const lang = language === 'en' ? 'en' : 'es';
  const periodLabel = periodKind === 'month' ? (lang === 'en' ? 'month' : 'mes') : lang === 'en' ? 'week' : 'semana';

  const fidelity = buildObservationalFidelitySnippet(lang);
  const system =
    lang === 'en'
      ? `You write observational wellness pattern reports for a mental health companion app.
${fidelity}
Rules (strict):
- JSON only, no markdown.
- NO diagnoses, NO clinical labels, NO medication advice.
- NO quoting user chat messages verbatim.
- Use correlational language ("may", "coincided", "worth noticing").
- One small behavioral suggestion max (conductSuggestion), optional.
- Always include disclaimers array with non-clinical framing.
Schema: {"headline":"string","insights":[{"type":"string","label":"string","detail":"string"}],"conductSuggestion":"string|null","disclaimers":["string"]}`
      : `Escribes informes observacionales de bienestar para una app de acompañamiento emocional.
${fidelity}
Reglas (estrictas):
- Solo JSON, sin markdown.
- SIN diagnósticos, SIN etiquetas clínicas, SIN consejos de medicación.
- SIN citar mensajes del chat literalmente.
- Lenguaje correlacional ("puede", "coincidió", "conviene notar").
- Máximo una sugerencia conductual pequeña (conductSuggestion), opcional.
- Siempre incluye disclaimers con marco no clínico.
Esquema: {"headline":"string","insights":[{"type":"string","label":"string","detail":"string"}],"conductSuggestion":"string|null","disclaimers":["string"]}`;

  const user = [
    lang === 'en' ? `Period: ${periodLabel}` : `Periodo: ${periodLabel}`,
    lang === 'en' ? 'Heuristic headline:' : 'Titular heurístico:',
    basePayload.headline || '',
    lang === 'en' ? 'Draft insights:' : 'Borradores de insights:',
    ...(basePayload.insights || []).map((r, i) => `${i + 1}. ${r.label}: ${r.detail}`),
    lang === 'en' ? 'Correlations:' : 'Correlaciones:',
    buildCorrelationDigest(correlations, lang),
    buildPhenotypeDigest(basePayload.sourceSummary, lang),
    lang === 'en'
      ? 'Rewrite for warmth and clarity. Link habits to chat/session rhythm when data supports it.'
      : 'Reescribe con calidez y claridad. Relaciona hábitos con el ritmo de chat/sesiones si los datos lo permiten.',
  ].join('\n');

  try {
    const model = process.env.WEEKLY_INSIGHT_LLM_MODEL || 'gpt-4o-mini';
    const completion = await openaiService.createChatCompletionResilient({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_completion_tokens: 900,
      temperature: 0.35,
      response_format: { type: 'json_object' },
    });

    const raw = completion?.choices?.[0]?.message?.content || '';
    const parsed = JSON.parse(raw);
    const validated = validateLlmInsightPayload(parsed, { language: lang });
    if (!validated) {
      return basePayload;
    }

    const abcInsights = (basePayload.insights || []).filter((row) => row?.type === 'abc_macro_pattern');
    const mergedInsights = [...abcInsights, ...validated.insights]
      .filter(
        (row, index, arr) =>
          row &&
          arr.findIndex((other) => other?.type === row.type && other?.detail === row.detail) === index,
      )
      .slice(0, 6);

    return {
      ...basePayload,
      abcPatterns: basePayload.abcPatterns || [],
      headline: validated.headline,
      body: validated.body || basePayload.body || '',
      insights: mergedInsights.length > 0 ? mergedInsights : basePayload.insights,
      llmEnriched: true,
      conductSuggestion: validated.conductSuggestion,
      disclaimers: validated.disclaimers,
    };
  } catch {
    return basePayload;
  }
}

export default {
  isWeeklyInsightLlmEnabled,
  validateLlmInsightPayload,
  enrichPatternInsightWithLlm,
};
