/**
 * Etiquetas legibles para el grafo (fallback cliente si falta displayLabel del API).
 */

const DEFAULT_MAX_LEN = 52;

const FILLER_PREFIXES_ES = [
  /^no\s+s[eé]\s*,?\s*/i,
  /^solo\s+/i,
  /^simplemente\s+/i,
  /^la verdad es que\s+/i,
  /^es que\s+/i,
  /^pues\s+/i,
  /^bueno\s*,?\s*/i,
  /^o\s+sea\s*,?\s*/i,
  /^en\s+realidad\s+/i,
];

const FILLER_PREFIXES_EN = [
  /^i\s+don'?t\s+know\s*,?\s*/i,
  /^i\s+just\s+/i,
  /^just\s+/i,
  /^honestly\s*,?\s*/i,
  /^like\s+,?\s*/i,
  /^basically\s+,?\s*/i,
];

function truncateAtWord(text, maxLen) {
  const s = String(text || '').trim();
  if (s.length <= maxLen) return s;
  const cut = s.slice(0, maxLen - 1);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > Math.floor(maxLen * 0.45)) {
    return `${cut.slice(0, lastSpace)}…`;
  }
  return `${cut}…`;
}

export function summarizeGraphSourceLabel(raw, language = 'es', { maxLen = DEFAULT_MAX_LEN } = {}) {
  const lang = language === 'en' ? 'en' : 'es';
  const fallback = lang === 'en' ? 'Personal theme' : 'Tema personal';
  let text = String(raw || '').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return fallback;

  if (lang === 'es') {
    text = text.replace(/^no se\b/i, 'No sé').replace(/^no se,/i, 'No sé,');
  }

  const patterns = lang === 'en' ? FILLER_PREFIXES_EN : FILLER_PREFIXES_ES;
  let changed = true;
  while (changed) {
    changed = false;
    for (const re of patterns) {
      const next = text.replace(re, '');
      if (next !== text) {
        text = next.trim();
        changed = true;
      }
    }
  }
  if (!text) text = String(raw || '').trim();
  text = text.charAt(0).toUpperCase() + text.slice(1);
  return truncateAtWord(text, maxLen);
}

export function resolveTopicFreeDisplayLabel(topicFree, edges, language = 'es') {
  const key = String(topicFree || '').trim();
  if (!key) return summarizeGraphSourceLabel('', language);
  const hit = (edges || []).find((edge) => String(edge?.topicFree || '').trim() === key);
  return hit?.displayLabel || summarizeGraphSourceLabel(key, language);
}
