/**
 * Evita que turnos factuales (meds, “apoyo reciente”) borren ansiedad alta
 * recién nombrada en el hilo (p. ej. ataques regulares → intensity 4/neutral).
 */

const THREAD_ANXIETY_LOAD_PATTERN =
  /(?:ataques?\s+de\s+ansiedad|ataques?\s+de\s+p[aá]nico|angustia\s+regular|casi\s+todos\s+los\s+d[ií]as|panic\s+attacks?|anxiety\s+attacks?|regular(?:ly)?\s+(?:panic|anxiety))/i;

/**
 * @param {Array<{ role?: string, content?: string }>|null|undefined} history
 * @param {string} [currentUserContent]
 * @param {{ newestFirst?: boolean }} [opts]
 * @returns {string[]}
 */
export function collectRecentUserTexts(history = [], currentUserContent = '', opts = {}) {
  const newestFirst = opts.newestFirst !== false;
  const fromHist = (Array.isArray(history) ? history : [])
    .filter((m) => m && m.role === 'user')
    .map((m) => String(m.content || '').trim())
    .filter(Boolean);
  const chrono = newestFirst ? [...fromHist].reverse() : [...fromHist];
  const cur = String(currentUserContent || '').trim();
  if (cur && chrono[chrono.length - 1] !== cur) {
    chrono.push(cur);
  }
  return chrono.slice(-4);
}

/**
 * @param {object|null|undefined} emotional
 * @param {string[]} recentUserTexts
 * @returns {object|null|undefined}
 */
export function applyEmotionalThreadContinuity(emotional, recentUserTexts = []) {
  if (!emotional || typeof emotional !== 'object') return emotional;
  const blob = (Array.isArray(recentUserTexts) ? recentUserTexts : []).join('\n');
  if (!THREAD_ANXIETY_LOAD_PATTERN.test(blob)) return emotional;

  const out = { ...emotional };
  const emotion = String(out.mainEmotion || 'neutral');
  if (emotion === 'neutral' || emotion === 'alegria' || emotion === 'esperanza') {
    out.mainEmotion = 'ansiedad';
    out.category = out.category === 'positive' ? 'negative' : out.category || 'negative';
  }
  const intensity = Number(out.intensity);
  const base = Number.isFinite(intensity) ? intensity : 0;
  if (base < 6) {
    out.intensity = 6;
  }
  out.threadContinuityApplied = true;
  return out;
}
