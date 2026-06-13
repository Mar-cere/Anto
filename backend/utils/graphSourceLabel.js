/**
 * Etiquetas legibles para nodos del grafo (topicFree / conceptos).
 * Parafraseo determinístico: quita muletillas, corrige typos frecuentes y acorta.
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

function stripControlChars(text) {
  return String(text || '').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
}

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

function normalizeOpeningTypos(text, language) {
  let out = text;
  if (language === 'en') return out;
  out = out.replace(/^no se\b/i, 'No sé');
  out = out.replace(/^no se,/i, 'No sé,');
  return out;
}

function stripFillers(text, language) {
  let out = text;
  const patterns = language === 'en' ? FILLER_PREFIXES_EN : FILLER_PREFIXES_ES;
  let changed = true;
  while (changed) {
    changed = false;
    for (const re of patterns) {
      const next = out.replace(re, '');
      if (next !== out) {
        out = next.trim();
        changed = true;
      }
    }
  }
  return out.trim();
}

function capitalizeFirst(text) {
  const s = String(text || '').trim();
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * @param {string} raw
 * @param {'es'|'en'} language
 * @param {{ maxLen?: number }} opts
 */
export function summarizeGraphSourceLabel(raw, language = 'es', { maxLen = DEFAULT_MAX_LEN } = {}) {
  const lang = language === 'en' ? 'en' : 'es';
  const fallback = lang === 'en' ? 'Personal theme' : 'Tema personal';
  let text = stripControlChars(raw);
  if (!text) return fallback;

  text = normalizeOpeningTypos(text, lang);
  text = stripFillers(text, lang);
  if (!text) {
    text = stripControlChars(raw);
  }
  text = capitalizeFirst(text);
  return truncateAtWord(text, maxLen);
}

/**
 * Elige la mejor etiqueta corta entre varios snippets del mismo cluster.
 */
export function pickClusterDisplayLabel(samples, language = 'es', opts = {}) {
  const polished = (samples || [])
    .filter(Boolean)
    .map((sample) => summarizeGraphSourceLabel(sample, language, opts))
    .filter((label) => label.length > 2);

  if (polished.length === 0) {
    return language === 'en' ? 'Personal theme' : 'Tema personal';
  }

  polished.sort((a, b) => a.length - b.length || a.localeCompare(b));
  return polished[0];
}

export default {
  summarizeGraphSourceLabel,
  pickClusterDisplayLabel,
};
