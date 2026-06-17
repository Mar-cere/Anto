/**
 * Validación y sanitización de eventos del grafo #127.
 */
import { buildTopicFreeFromUserContent } from './interventionTopicFree.js';

const SOURCE_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;
const META_STRING_KEYS = new Set([
  'surface',
  'continuityId',
  'label',
  'screen',
  'interventionType',
]);

export function sanitizeInterventionTopicTag(raw, fallback = 'library') {
  const t = String(raw || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_-]+/gu, '_')
    .slice(0, 64);
  return t || fallback;
}

export function sanitizeInterventionTopicFree(raw) {
  if (raw == null) return null;
  const free = buildTopicFreeFromUserContent(String(raw), { minLength: 0 });
  if (!free || !String(free).trim()) return null;
  return free;
}

export function sanitizeInterventionSource(raw, fallback = 'library_v1') {
  const s = String(raw || fallback).trim().toLowerCase().slice(0, 64);
  return SOURCE_PATTERN.test(s) ? s : fallback;
}

/**
 * Meta acotada: solo claves conocidas y strings cortos (evita payloads arbitrarios).
 * @param {unknown} raw
 */
export function sanitizeInterventionEventMeta(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!META_STRING_KEYS.has(key)) continue;
    if (typeof value === 'string') {
      out[key] = value.slice(0, 200);
    }
  }
  if (Array.isArray(raw.tags)) {
    out.tags = raw.tags
      .filter((t) => typeof t === 'string')
      .slice(0, 12)
      .map((t) => t.slice(0, 40));
  }
  return out;
}
