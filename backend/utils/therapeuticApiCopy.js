/**
 * Mensajes de API de técnicas terapéuticas (es/en).
 */
import { normalizeApiLanguage } from './apiLanguage.js';

export { normalizeApiLanguage };

const COPY = {
  es: {
    listError: 'Error al obtener técnicas terapéuticas',
    emotionError: 'Error al obtener técnicas terapéuticas',
    mindfulnessError: 'Error al obtener técnicas de mindfulness',
    psychoeducationError: 'Error al obtener información psicoeducativa',
    psychoeducationTopicsError: 'Error al obtener temas de psicoeducación',
    psychoeducationNotFound: (topic) => `Tema no encontrado: ${topic}`,
    useMissingFields:
      'Faltan campos requeridos: techniqueId, techniqueName, techniqueType',
    useError: 'Error al registrar uso de técnica',
    historyError: 'Error al obtener historial de técnicas',
    statsError: 'Error al obtener estadísticas de técnicas',
    useSuccess: 'Uso de técnica registrado',
  },
  en: {
    listError: 'Could not load therapeutic techniques',
    emotionError: 'Could not load therapeutic techniques',
    mindfulnessError: 'Could not load mindfulness techniques',
    psychoeducationError: 'Could not load psychoeducation content',
    psychoeducationTopicsError: 'Could not load psychoeducation topics',
    psychoeducationNotFound: (topic) => `Topic not found: ${topic}`,
    useMissingFields:
      'Missing required fields: techniqueId, techniqueName, techniqueType',
    useError: 'Could not record technique usage',
    historyError: 'Could not load technique history',
    statsError: 'Could not load technique statistics',
    useSuccess: 'Technique usage recorded',
  },
};

export function therapeuticApiCopy(language) {
  return COPY[normalizeApiLanguage(language)];
}
