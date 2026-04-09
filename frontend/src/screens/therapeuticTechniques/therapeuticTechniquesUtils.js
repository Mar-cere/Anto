/**
 * Parseo y utilidades defensivas para la API de técnicas terapéuticas.
 */
import { CATEGORIES, TEXTS } from './therapeuticTechniquesConstants';

const TYPE_MAP = {
  immediate: CATEGORIES.IMMEDIATE,
  cbt: CATEGORIES.CBT,
  dbt: CATEGORIES.DBT,
  act: CATEGORIES.ACT,
};

/** Normaliza category/type del backend al bucket del acordeón. */
export function normalizeTechniqueCategory(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') return CATEGORIES.IMMEDIATE;
  const t = raw.trim();
  const key = t.toLowerCase();
  if (TYPE_MAP[key]) return TYPE_MAP[key];
  if (t === CATEGORIES.CBT || t === CATEGORIES.DBT || t === CATEGORIES.ACT) return t;
  return CATEGORIES.IMMEDIATE;
}

/**
 * Interpreta la respuesta GET /api/therapeutic-techniques.
 * Acepta array en `data` aunque falte `success: true` (tolerancia a cambios del backend).
 */
export function parseTherapeuticTechniquesResponse(res) {
  if (!res || typeof res !== 'object' || res.notModified) {
    return { ok: false, error: TEXTS.ERROR, data: [] };
  }
  if (res.success === false) {
    const msg =
      typeof res.message === 'string' && res.message.trim() !== '' ? res.message : TEXTS.ERROR;
    return { ok: false, error: msg, data: [] };
  }
  if (Array.isArray(res.data)) {
    return { ok: true, data: res.data };
  }
  return { ok: false, error: TEXTS.ERROR, data: [] };
}
