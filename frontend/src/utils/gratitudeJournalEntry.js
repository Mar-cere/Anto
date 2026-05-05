/**
 * Normaliza texto mostrable de una entrada del diario de gratitud.
 * Soporta formato antiguo ({ text }) y nuevo ({ lines: [a,b,c] }).
 */
export function getGratitudeEntryDisplayText(entry) {
  if (!entry) return '';
  if (Array.isArray(entry.lines)) {
    const parts = entry.lines.map((s) => (s == null ? '' : String(s).trim())).filter(Boolean);
    if (parts.length === 0) return entry.text || '';
    return parts.map((line, i) => `${i + 1}) ${line}`).join('\n');
  }
  return entry.text || '';
}

/** Una sola línea para preview (tarjeta dashboard): compacto. */
export function getGratitudeEntryPreviewLine(entry, maxLen = 120) {
  const full = getGratitudeEntryDisplayText(entry);
  if (!full) return '';
  const oneLine = full.replace(/\n/g, ' · ');
  if (oneLine.length <= maxLen) return oneLine;
  return `${oneLine.slice(0, maxLen - 1)}…`;
}

/**
 * Filtra entradas inválidas tras leer JSON de almacenamiento local.
 * @param {unknown} parsed
 * @returns {Array<{ id: number|string, date: string, text?: string, lines?: string[] }>}
 */
export function sanitizeGratitudeEntriesFromStorage(parsed) {
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item) => {
    if (!item || typeof item !== 'object') return false;
    if (item.id == null || typeof item.date !== 'string') return false;
    const idOk = typeof item.id === 'number' || typeof item.id === 'string';
    if (!idOk) return false;
    if (Array.isArray(item.lines)) return true;
    return typeof item.text === 'string';
  });
}
