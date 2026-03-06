/**
 * Constantes del servicio de perfil de usuario.
 * Extraído de userProfileService para mantener el servicio más manejable.
 */

export const DEFAULT_COMMUNICATION_STYLE = 'neutral';
export const DEFAULT_RESPONSE_LENGTH = 'MEDIUM';
export const DEFAULT_EMOTION = 'neutral';
export const DEFAULT_INTENSITY = 5;
export const DEFAULT_TENDENCY = 'estable';

export const HOURS_FOR_INSIGHT = 24;
export const INTENSITY_THRESHOLD = 8;
export const SESSIONS_FOR_INSIGHT = 5;
export const DAYS_FOR_PATTERNS = 7;
export const DAYS_FOR_INSIGHTS = 30;
export const INTENSITY_DIFF_THRESHOLD = 2;
export const HISTORY_LIMIT = 50;

export const INTENSITY_HIGH = 8;
export const INTENSITY_MEDIUM = 4;

export const PERIODOS = {
  MADRUGADA: { inicio: 0, fin: 5, nombre: 'madrugada' },
  MAÑANA: { inicio: 6, fin: 11, nombre: 'mañana' },
  MEDIODIA: { inicio: 12, fin: 14, nombre: 'mediodía' },
  TARDE: { inicio: 15, fin: 18, nombre: 'tarde' },
  NOCHE: { inicio: 19, fin: 23, nombre: 'noche' }
};

export const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export const DIMENSIONES_ANALISIS = {
  EMOCIONAL: {
    aspectos: ['intensidad', 'variabilidad', 'regulación'],
    patrones: ['recurrentes', 'situacionales', 'temporales']
  },
  COGNITIVO: {
    aspectos: ['flexibilidad', 'autocrítica', 'creencias'],
    patrones: ['automáticos', 'adaptativos', 'desadaptativos']
  },
  CONDUCTUAL: {
    aspectos: ['afrontamiento', 'evitación', 'búsqueda_apoyo'],
    patrones: ['activos', 'pasivos', 'mixtos']
  },
  RELACIONAL: {
    aspectos: ['vínculos', 'comunicación', 'límites'],
    patrones: ['cercanos', 'sociales', 'profesionales']
  }
};
