/**
 * Titular LLM opcional para insight de sesión post-chat (best-effort).
 */
import openaiService from './openaiService.js';
import {
  collectRiskLevelsFromMessages,
  maxRiskTierFromLevels,
  sanitizeContinuationText,
} from './lastSessionSummaryService.js';
import { getEmotionInsightMeta, normalizeInsightLanguage } from '../utils/sessionInsightCopy.js';

const HEADLINE_MAX = 90;
const TRANSCRIPT_MAX = 6000;

function parseHeadlineJson(raw) {
  const text = String(raw || '').trim();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    return typeof parsed?.headline === 'string' ? parsed.headline.trim() : null;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      const parsed = JSON.parse(match[0]);
      return typeof parsed?.headline === 'string' ? parsed.headline.trim() : null;
    } catch {
      return null;
    }
  }
}

function shouldSkipLlmForRisk(riskTier) {
  const t = String(riskTier || 'low').toLowerCase();
  return t === 'high' || t === 'medium' || t === 'warning';
}

function normalizeHeadlineOutput(raw, fallback = '') {
  let headline = sanitizeContinuationText(raw, HEADLINE_MAX);
  if (!headline) return null;
  headline = headline.replace(/^["'«""]+|["'»""]+$/g, '').trim();
  headline = headline.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  if (headline.length < 12) return null;
  const fb = String(fallback || '').trim().toLowerCase();
  if (fb && headline.toLowerCase() === fb) return null;
  if (/^(titular|headline)\s*(de\s+)?(respaldo|fallback)/i.test(headline)) return null;
  return headline;
}

function buildTranscript(userMsgs, maxChars = TRANSCRIPT_MAX) {
  return userMsgs
    .map((m) => String(m?.content || '').trim())
    .filter(Boolean)
    .join('\n')
    .slice(0, maxChars);
}

/**
 * @returns {Promise<string|null>}
 */
export async function generateSessionInsightHeadline({
  userMsgs = [],
  allMsgs = [],
  language = 'es',
  fallbackHeadline = '',
  dominantEmotion = 'neutral',
  thoughtPattern = null,
  enabled = true,
}) {
  if (!enabled) return null;
  if (!process.env.OPENAI_API_KEY) return null;
  if (!Array.isArray(userMsgs) || userMsgs.length < 2) return null;

  const riskTier = maxRiskTierFromLevels(collectRiskLevelsFromMessages(allMsgs));
  if (shouldSkipLlmForRisk(riskTier)) return null;

  const lang = normalizeInsightLanguage(language);
  const en = lang === 'en';
  const emotionMeta = getEmotionInsightMeta(dominantEmotion, lang);
  const transcript = buildTranscript(userMsgs);
  if (transcript.length < 40) return null;

  const patternHint = thoughtPattern?.name
    ? en
      ? `Possible thinking pattern: ${thoughtPattern.name}.`
      : `Posible patrón de pensamiento: ${thoughtPattern.name}.`
    : '';

  const model = process.env.SESSION_INSIGHT_HEADLINE_MODEL || 'gpt-4o-mini';
  const system = en
    ? 'You write ONE warm headline (max 90 chars) for a post-chat emotional insight screen in a wellbeing app. Ground it in the WHOLE arc of the user messages (not only the last one). Prefer the main emotional load (e.g. panic, exhaustion, fear) over a side theme. Not clinical. No diagnosis. No quotes. No generic wellness slogans. JSON only: {"headline":"..."}'
    : 'Escribes UN titular cálido (máx. 90 caracteres) para una pantalla de insight post-chat en una app de bienestar. Ancla el titular en el arco COMPLETO de los mensajes (no solo el último). Prioriza la carga emocional principal (p. ej. pánico, agotamiento, susto) sobre un tema lateral. No clínico. Sin diagnóstico. Sin comillas. Sin eslóganes genéricos de bienestar. Solo JSON: {"headline":"..."}';

  const userPrompt = en
    ? `Dominant emotion: ${emotionMeta.label}.\n${patternHint}\nFallback headline: ${fallbackHeadline}\n\nUser messages (chronological):\n${transcript}\n\nReturn JSON with a single headline that feels personal and validating. Cover the main thread of the session, not a late side detail alone.`
    : `Emoción dominante: ${emotionMeta.label}.\n${patternHint}\nTitular de respaldo: ${fallbackHeadline}\n\nMensajes del usuario (cronológicos):\n${transcript}\n\nDevuelve JSON con un titular personal y validante. Cubre el hilo principal de la sesión, no solo un detalle tardío.`;

  try {
    const completion = await openaiService.createChatCompletionResilient({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt },
      ],
      max_completion_tokens: 120,
      temperature: 0.35,
    });

    const raw = completion?.choices?.[0]?.message?.content || '';
    const parsed = parseHeadlineJson(raw);
    return normalizeHeadlineOutput(parsed, fallbackHeadline);
  } catch {
    return null;
  }
}

export function isSessionInsightHeadlineLlmEnabled() {
  return process.env.ENABLE_SESSION_INSIGHT_HEADLINE_LLM !== 'false';
}

export default {
  generateSessionInsightHeadline,
  isSessionInsightHeadlineLlmEnabled,
};
