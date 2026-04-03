/**
 * Heurísticas ligeras para detectar respuestas "de plantilla" y eco del mensaje del usuario.
 * Sirve para telemetría (métricas) y para monitorizar mejoras de prompt.
 */

const STOCK_PATTERNS = [
  { key: 'lo_siento', re: /\blo siento\b/gi },
  { key: 'siento_mucho', re: /\bsiento mucho\b/gi },
  { key: 'lamento', re: /\blamento\b/gi },
  { key: 'es_valido', re: /\bes (totalmente )?válid[oa]\b/gi },
  { key: 'es_normal', re: /\bes normal\b/gi },
  { key: 'entiendo_como', re: /\bentiendo cómo te sientes\b/gi },
  { key: 'no_estas_solo', re: /\bno estás sol[oa]\b/gi },
  { key: 'te_escucho', re: /\bte escucho\b/gi }
];

const STOPWORDS = new Set([
  'esto', 'esta', 'este', 'estos', 'estas', 'para', 'como', 'cómo', 'cada', 'todo', 'toda', 'algo',
  'aqui', 'aquí', 'donde', 'dónde', 'muy', 'más', 'menos', 'sobre', 'entre', 'después', 'antes',
  'hacer', 'estar', 'tener', 'decir', 'puede', 'puedo', 'quiero', 'siento', 'siente', 'cosas'
]);

/**
 * Palabras de usuario que suelen ser "relleno emocional" si el asistente las repite (eco vacío).
 * Temas concretos (trabajo, familia, nombres propios comunes) no van aquí.
 */
const GENERIC_ECHO_WORDS = new Set([
  'ansioso', 'ansiosa', 'ansiosos', 'ansiosas', 'nervioso', 'nerviosa', 'nerviosos', 'nerviosas',
  'triste', 'tristes', 'feliz', 'felices', 'solo', 'sola', 'solos', 'solas', 'cansado', 'cansada',
  'cansados', 'cansadas', 'mal', 'bien', 'peor', 'mejor', 'fuerte', 'fuertes', 'débil', 'débiles',
  'raro', 'rara', 'raros', 'raras', 'extraño', 'extraña', 'extraños', 'extrañas', 'horrible',
  'horribles', 'terrible', 'terribles', 'jodido', 'jodida', 'mismo', 'misma', 'mismos', 'mismas',
  'bastante', 'demasiado', 'demasiada', 'mucho', 'mucha', 'muchos', 'muchas', 'poco', 'poca',
  'pocos', 'pocas', 'nada', 'algo', 'así', 'acaso', 'realmente', 'totalmente', 'completamente',
  'super', 'recontra', 'medio', 'media', 'malisimo', 'malísima', 'buenisimo', 'buenísima',
  'agotado', 'agotada', 'harto', 'harta', 'hartos', 'harta', 'vacío', 'vacía', 'vacios', 'vacías',
  'confundido', 'confundida', 'perdido', 'perdida', 'perdidos', 'perdidas'
]);

function wordInText(word, haystack) {
  try {
    return new RegExp(`\\b${word}\\b`, 'iu').test(haystack);
  } catch {
    return haystack.toLowerCase().includes(word);
  }
}

/**
 * @param {string} assistantText
 * @param {string} [lastUserText]
 * @returns {object} Incluye eco útil vs eco vacío y ratios; echoOverlapRatio sigue siendo el total (compat).
 */
export function analyzeAssistantResponseTemplateSignals(assistantText, lastUserText = '') {
  const text = assistantText || '';
  const stockPhraseHits = {};
  let stockPhraseScore = 0;
  for (const { key, re } of STOCK_PATTERNS) {
    const matches = text.match(re);
    const n = matches ? matches.length : 0;
    if (n > 0) {
      stockPhraseHits[key] = n;
      stockPhraseScore += n;
    }
  }

  const userText = (lastUserText || '').toLowerCase();
  const userWords = userText
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
  const sig = [...new Set(userWords)].slice(0, 14);
  let echoUsefulHits = 0;
  let echoEmptyHits = 0;
  for (const w of sig) {
    if (!wordInText(w, text)) continue;
    if (GENERIC_ECHO_WORDS.has(w)) echoEmptyHits += 1;
    else echoUsefulHits += 1;
  }
  const n = sig.length || 1;
  const echoUsefulRatio = Math.min(1, echoUsefulHits / n);
  const echoEmptyRatio = Math.min(1, echoEmptyHits / n);
  const overlap = echoUsefulHits + echoEmptyHits;
  const echoOverlapRatio = sig.length ? Math.min(1, overlap / sig.length) : 0;

  return {
    stockPhraseHits,
    stockPhraseScore,
    echoOverlapRatio,
    echoUsefulHits,
    echoEmptyHits,
    echoUsefulRatio,
    echoEmptyRatio,
    userSigCount: sig.length
  };
}

/**
 * Clave compacta para agrupar en métricas (r/a/p = flags de chatPreferences).
 */
export function encodeChatPreferencesKey(prefs) {
  if (!prefs || typeof prefs !== 'object') return 'r0a0p0';
  const r = prefs.reduceStockEmpathy ? 1 : 0;
  const a = prefs.avoidApologyOpenings ? 1 : 0;
  const p = prefs.preferQuestions ? 1 : 0;
  return `r${r}a${a}p${p}`;
}
