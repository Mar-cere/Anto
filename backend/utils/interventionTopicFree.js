/**
 * Tema libre (#127 fase 2): fragmento del mensaje del usuario asociado al nodo del grafo.
 */
const DEFAULT_MIN = 8;
const DEFAULT_MAX = 120;

export function buildTopicFreeFromUserContent(raw, options = {}) {
  const max = Number(options.maxLength) > 0 ? Number(options.maxLength) : DEFAULT_MAX;
  const min = Number(options.minLength) >= 0 ? Number(options.minLength) : DEFAULT_MIN;
  const text = String(raw || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length < min) return null;
  if (text.length <= max) return text;

  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  if (lastSpace > max * 0.6) {
    return `${slice.slice(0, lastSpace).trim()}…`;
  }
  return `${slice.trim()}…`;
}

/**
 * Extrae topicFree de un ítem de continuidad TCC (subtítulo con contenido del usuario).
 * @param {{ subtitle?: string, title?: string }|null|undefined} item
 */
export function buildTopicFreeFromContinuityItem(item) {
  if (!item || typeof item !== 'object') return null;
  const subtitle = String(item.subtitle || '').trim();
  if (subtitle) {
    const fromSubtitle = buildTopicFreeFromUserContent(subtitle, { minLength: 6 });
    if (fromSubtitle) return fromSubtitle;
  }
  const title = String(item.title || '').trim();
  return buildTopicFreeFromUserContent(title, { minLength: 6 });
}
