/**
 * Constantes para la pantalla de técnicas terapéuticas.
 */

export const CATEGORIES = {
  IMMEDIATE: 'immediate',
  CBT: 'CBT',
  DBT: 'DBT',
  ACT: 'ACT',
};

export const TEXTS = {
  TITLE: 'Técnicas Terapéuticas',
  SUBTITLE: 'Herramientas basadas en evidencia',
  /** Una línea: qué hacer en esta pantalla (orienta sin recargar). */
  HOW_IT_WORKS: 'Abre una categoría, elige una práctica y sigue los pasos o el ejercicio guiado.',
  STATS: 'Estadísticas',
  STATS_HINT: 'Ver tu uso y progreso',
  CLEAR_EMOTION_FILTER: 'Ver todas',
  /** Cabeceras cortas en acordeón (nombre largo en accesibilidad). */
  CATEGORY_IMMEDIATE_SHORT: 'Inmediatas',
  CATEGORY_CBT_SHORT: 'TCC',
  CATEGORY_DBT_SHORT: 'DBT',
  CATEGORY_ACT_SHORT: 'ACT',
  CATEGORY_IMMEDIATE: 'Técnicas Inmediatas',
  CATEGORY_CBT: 'Terapia Cognitivo-Conductual (TCC)',
  CATEGORY_DBT: 'Terapia Dialéctica Conductual (DBT)',
  CATEGORY_ACT: 'Terapia de Aceptación y Compromiso (ACT)',
  LOADING: 'Cargando técnicas...',
  ERROR: 'No pudimos cargar las técnicas. Comprueba la conexión e inténtalo de nuevo.',
  RETRY: 'Reintentar',
  NO_TECHNIQUES: 'No hay técnicas disponibles en este momento.',
  NO_MATCH_FILTER:
    'No hay técnicas asociadas a esta emoción. Prueba con «Todas» o elige otra.',
  FILTER_BY_EMOTION: 'Filtrar por emoción',
  ALL_EMOTIONS: 'Todas las emociones',
  EMOTION_FILTER_A11Y: 'Filtro de emociones',
  EMOTION_FILTER_TOGGLE_SHOW: 'Filtrar por emoción',
  EMOTION_FILTER_TOGGLE_HIDE: 'Ocultar filtro de emoción',
  SECTION_EXPAND: 'Abrir sección',
  SECTION_COLLAPSE: 'Cerrar sección',
};

/** Acento visual por categoría (alineado con TechniqueCard). */
export const CATEGORY_ACCENT = {
  [CATEGORIES.IMMEDIATE]: '#FFB800',
  [CATEGORIES.CBT]: '#4A90E2',
  [CATEGORIES.DBT]: '#E94B3C',
  [CATEGORIES.ACT]: '#50C878',
};

/** Una frase por categoría: qué aporta (visible aunque el acordeón esté cerrado). */
export const CATEGORY_HINT = {
  [CATEGORIES.IMMEDIATE]: 'Para cuando necesitas calma o contención al momento',
  [CATEGORIES.CBT]: 'Trabajar pensamientos, creencias y conductas',
  [CATEGORIES.DBT]: 'Regular emociones muy intensas',
  [CATEGORIES.ACT]: 'Aceptación, valores y pasos hacia lo importante',
};

/** Orden de bloques en pantalla (prioridad visual). */
export const CATEGORY_ORDER = [
  CATEGORIES.IMMEDIATE,
  CATEGORIES.CBT,
  CATEGORIES.DBT,
  CATEGORIES.ACT,
];

export const CATEGORY_SHORT_LABEL = {
  [CATEGORIES.IMMEDIATE]: TEXTS.CATEGORY_IMMEDIATE_SHORT,
  [CATEGORIES.CBT]: TEXTS.CATEGORY_CBT_SHORT,
  [CATEGORIES.DBT]: TEXTS.CATEGORY_DBT_SHORT,
  [CATEGORIES.ACT]: TEXTS.CATEGORY_ACT_SHORT,
};

export const CATEGORY_FULL_LABEL = {
  [CATEGORIES.IMMEDIATE]: TEXTS.CATEGORY_IMMEDIATE,
  [CATEGORIES.CBT]: TEXTS.CATEGORY_CBT,
  [CATEGORIES.DBT]: TEXTS.CATEGORY_DBT,
  [CATEGORIES.ACT]: TEXTS.CATEGORY_ACT,
};

export const EMOTIONS = [
  { key: 'all', label: 'Todas', icon: 'emoticon-happy' },
  { key: 'tristeza', label: 'Tristeza', icon: 'emoticon-sad' },
  { key: 'ansiedad', label: 'Ansiedad', icon: 'emoticon-confused' },
  { key: 'enojo', label: 'Enojo', icon: 'emoticon-angry' },
  { key: 'miedo', label: 'Miedo', icon: 'emoticon-sick' },
  { key: 'verguenza', label: 'Vergüenza', icon: 'emoticon-neutral' },
  { key: 'culpa', label: 'Culpa', icon: 'emoticon-cry' },
  { key: 'alegria', label: 'Alegría', icon: 'emoticon-happy' },
  { key: 'esperanza', label: 'Esperanza', icon: 'emoticon-excited' },
];

export const EMOTION_KEYS = new Set(EMOTIONS.map((e) => e.key));

/** Claves de acordeón válidas (evita estado raro si el mapa cambia). */
export const SECTION_KEYS = new Set(CATEGORY_ORDER);
