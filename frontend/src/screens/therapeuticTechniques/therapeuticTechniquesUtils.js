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
/** Tipo de ejercicio interactivo (breathing | grounding) desde API o nombre legacy. */
export function resolveInteractiveExerciseType(technique) {
  if (!technique || typeof technique !== 'object') return null;
  if (
    technique.interactiveExercise === 'breathing' ||
    technique.interactiveExercise === 'grounding'
  ) {
    return technique.interactiveExercise;
  }
  const name = String(technique.name || '').toLowerCase();
  if (/grounding.*5-4-3-2-1|5-4-3-2-1.*grounding/.test(name)) return 'grounding';
  if (/respir|breathing|breath of calm|conscious breathing/.test(name)) {
    return 'breathing';
  }
  const legacy = {
    'Respiración Consciente': 'breathing',
    'Grounding 5-4-3-2-1': 'grounding',
    'Respiración de Calma': 'breathing',
  };
  return legacy[technique.name] || null;
}

export function parseTherapeuticTechniquesResponse(res, texts = TEXTS) {
  if (!res || typeof res !== 'object' || res.notModified) {
    return { ok: false, error: texts.ERROR, data: [] };
  }
  if (res.success === false) {
    return { ok: false, error: texts.ERROR, data: [] };
  }
  if (Array.isArray(res.data)) {
    return { ok: true, data: res.data };
  }
  return { ok: false, error: texts.ERROR, data: [] };
}
