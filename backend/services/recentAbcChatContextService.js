/**
 * Snippet de ABC reciente para continuidad en chat (#212) — factual, sin pensamientos literales.
 */
import AbcRecord from '../models/AbcRecord.js';
import { sanitizeObservationalText } from '../utils/clinicalContentGuardrails.js';
import { normalizeApiLanguage } from '../utils/apiLanguage.js';

const LOOKBACK_HOURS = 72;

function normalizeWords(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sharesTopicHint(userContent, situation) {
  const content = normalizeWords(userContent);
  const words = normalizeWords(situation)
    .split(' ')
    .filter((w) => w.length > 3);
  if (!content || words.length === 0) return false;
  return words.some((w) => content.includes(w));
}

export async function buildRecentAbcChatSnippet({
  userId,
  userContent = '',
  language = 'es',
  riskLevel = 'LOW',
} = {}) {
  if (!userId) return null;
  if (String(riskLevel || 'LOW').toUpperCase() === 'HIGH') return null;

  const since = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000);
  const records = await AbcRecord.findByUser(userId, {
    startDate: since,
    archived: false,
    limit: 1,
    sortBy: 'entryDate',
    sortOrder: 'desc',
  });

  const recent = records?.[0];
  if (!recent) return null;

  const situation = sanitizeObservationalText(recent.activatingEvent, 80);
  if (!situation) return null;

  const content = String(userContent || '').trim();
  if (content.length < 4 || !sharesTopicHint(content, situation)) {
    return null;
  }

  const lang = normalizeApiLanguage(language);
  const header =
    lang === 'en'
      ? '\n\n### Recent ABC self-monitoring (factual)\n'
      : '\n\n### Autorregistro ABC reciente (factual)\n';
  const line =
    lang === 'en'
      ? `- A situation was logged recently: "${situation}". Mention only if it fits the user's message. No diagnosis. You may suggest opening ABC self-monitoring if helpful.`
      : `- Se registró una situación hace poco: «${situation}». Menciona solo si encaja con el mensaje del usuario. Sin diagnóstico. Puedes sugerir abrir el autorregistro ABC si ayuda.`;
  const footer =
    lang === 'en'
      ? 'Do not quote thoughts or beliefs from the record.'
      : 'No cites pensamientos ni creencias del registro.';

  return `${header}${line}\n${footer}\n`;
}

export default {
  buildRecentAbcChatSnippet,
};
