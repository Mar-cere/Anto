/**
 * Reglas de negocio para pensamientos automáticos (#89).
 */
import cognitiveDistortionDetector from '../services/cognitiveDistortionDetector.js';

/** Apatía pura: evita falso positivo «nada» en todo/nada (#88). */
const APATHY_WITHOUT_COGNITIVE =
  /(?:desmotivad[oa]|sin\s+ganas|sin\s+energ[ií]a|no\s+hago\s+nada|me\s+cuesta\s+(?:levantarme|salir|empezar)|ap[aá]tic[oa]|me\s+siento\s+apagad[oa]|sin\s+fuerzas|no\s+tengo\s+energ[ií]a|feel\s+numb|no\s+motivation|can'?t\s+get\s+(?:out\s+of\s+bed|started))/i;

const COGNITIVE_NAMING =
  /(?:noto\s+que|pienso\s+lo\s+peor|pensamiento\s+autom[aá]tico|keep\s+thinking|can'?t\s+stop\s+thinking|no\s+paro\s+de\s+(?:pensar|darle\s+vueltas)|reaccion[eé]\s+mal|what\s+went\s+through\s+my\s+mind)/i;

/**
 * Distorsión detectable sin confundir apatía (#88) con todo/nada.
 */
export function hasActionableDistortionInMessage(userContent = '') {
  const text = String(userContent || '');
  if (!text.trim()) return false;
  if (APATHY_WITHOUT_COGNITIVE.test(text) && !COGNITIVE_NAMING.test(text)) {
    return false;
  }
  return cognitiveDistortionDetector.detectDistortions(text).length > 0;
}

/**
 * @returns {{ distortionType: string, distortionName: string }}
 */
export function normalizeAutomaticThoughtDistortion({
  distortionType = '',
  distortionName = '',
} = {}) {
  const type = String(distortionType || '').trim().toLowerCase();
  if (!type || !/^[a-z_]+$/.test(type)) {
    return { distortionType: '', distortionName: '' };
  }
  const info = cognitiveDistortionDetector.getDistortionInfo(type);
  if (!info) {
    return { distortionType: '', distortionName: '' };
  }
  const name = String(distortionName || '').trim() || info.name || '';
  return {
    distortionType: type,
    distortionName: name.length > 200 ? `${name.slice(0, 199).trim()}…` : name,
  };
}

/**
 * Normaliza payload validado antes de persistir.
 */
export function prepareAutomaticThoughtCreatePayload(value = {}) {
  const distortion = normalizeAutomaticThoughtDistortion(value);
  return {
    ...value,
    distortionType: distortion.distortionType,
    distortionName: distortion.distortionName,
  };
}
