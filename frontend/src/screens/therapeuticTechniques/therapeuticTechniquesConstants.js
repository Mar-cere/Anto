/**
 * Constantes para la pantalla de técnicas terapéuticas.
 */

import { useMemo } from 'react';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { lightColors } from '../../styles/themePalettes';

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
  PSYCHOED_LIBRARY: 'Módulos de psicoeducación',
  PSYCHOED_LIBRARY_HINT: 'Temas breves con fuentes y lenguaje no diagnóstico',
  MICRO_GUIDE_LIBRARY: 'Micro-guías',
  MICRO_GUIDE_LIBRARY_HINT: 'Prácticas breves paso a paso para el momento',
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
  CATEGORY_HINT_IMMEDIATE: 'Para cuando necesitas calma o contención al momento',
  CATEGORY_HINT_CBT: 'Trabajar pensamientos, creencias y conductas',
  CATEGORY_HINT_DBT: 'Regular emociones muy intensas',
  CATEGORY_HINT_ACT: 'Aceptación, valores y pasos hacia lo importante',
  EMOTION_ALL: 'Todas',
  EMOTION_SADNESS: 'Tristeza',
  EMOTION_ANXIETY: 'Ansiedad',
  EMOTION_ANGER: 'Enojo',
  EMOTION_FEAR: 'Miedo',
  EMOTION_SHAME: 'Vergüenza',
  EMOTION_GUILT: 'Culpa',
  EMOTION_JOY: 'Alegría',
  EMOTION_HOPE: 'Esperanza',
};

export function useTherapeuticTechniquesTexts() {
  const translated = useSectionTranslations('TECHNIQUES');
  return useMemo(
    () => ({
      ...TEXTS,
      TITLE: translated?.THERAPEUTIC_TECHNIQUES_TITLE || TEXTS.TITLE,
      SUBTITLE: translated?.THERAPEUTIC_TECHNIQUES_SUBTITLE || TEXTS.SUBTITLE,
      HOW_IT_WORKS:
        translated?.THERAPEUTIC_TECHNIQUES_HOW_IT_WORKS || TEXTS.HOW_IT_WORKS,
      STATS: translated?.THERAPEUTIC_TECHNIQUES_STATS || TEXTS.STATS,
      STATS_HINT:
        translated?.THERAPEUTIC_TECHNIQUES_STATS_HINT || TEXTS.STATS_HINT,
      PSYCHOED_LIBRARY:
        translated?.THERAPEUTIC_TECHNIQUES_PSYCHOED_LIBRARY || TEXTS.PSYCHOED_LIBRARY,
      PSYCHOED_LIBRARY_HINT:
        translated?.THERAPEUTIC_TECHNIQUES_PSYCHOED_LIBRARY_HINT ||
        TEXTS.PSYCHOED_LIBRARY_HINT,
      MICRO_GUIDE_LIBRARY:
        translated?.THERAPEUTIC_TECHNIQUES_MICRO_GUIDE_LIBRARY || TEXTS.MICRO_GUIDE_LIBRARY,
      MICRO_GUIDE_LIBRARY_HINT:
        translated?.THERAPEUTIC_TECHNIQUES_MICRO_GUIDE_LIBRARY_HINT ||
        TEXTS.MICRO_GUIDE_LIBRARY_HINT,
      CLEAR_EMOTION_FILTER:
        translated?.THERAPEUTIC_TECHNIQUES_CLEAR_EMOTION_FILTER ||
        TEXTS.CLEAR_EMOTION_FILTER,
      CATEGORY_IMMEDIATE_SHORT:
        translated?.THERAPEUTIC_TECHNIQUES_CATEGORY_IMMEDIATE_SHORT ||
        TEXTS.CATEGORY_IMMEDIATE_SHORT,
      CATEGORY_CBT_SHORT:
        translated?.THERAPEUTIC_TECHNIQUES_CATEGORY_CBT_SHORT ||
        TEXTS.CATEGORY_CBT_SHORT,
      CATEGORY_DBT_SHORT:
        translated?.THERAPEUTIC_TECHNIQUES_CATEGORY_DBT_SHORT ||
        TEXTS.CATEGORY_DBT_SHORT,
      CATEGORY_ACT_SHORT:
        translated?.THERAPEUTIC_TECHNIQUES_CATEGORY_ACT_SHORT ||
        TEXTS.CATEGORY_ACT_SHORT,
      CATEGORY_IMMEDIATE:
        translated?.THERAPEUTIC_TECHNIQUES_CATEGORY_IMMEDIATE ||
        TEXTS.CATEGORY_IMMEDIATE,
      CATEGORY_CBT:
        translated?.THERAPEUTIC_TECHNIQUES_CATEGORY_CBT || TEXTS.CATEGORY_CBT,
      CATEGORY_DBT:
        translated?.THERAPEUTIC_TECHNIQUES_CATEGORY_DBT || TEXTS.CATEGORY_DBT,
      CATEGORY_ACT:
        translated?.THERAPEUTIC_TECHNIQUES_CATEGORY_ACT || TEXTS.CATEGORY_ACT,
      LOADING: translated?.THERAPEUTIC_TECHNIQUES_LOADING || TEXTS.LOADING,
      ERROR: translated?.THERAPEUTIC_TECHNIQUES_ERROR || TEXTS.ERROR,
      RETRY: translated?.THERAPEUTIC_TECHNIQUES_RETRY || TEXTS.RETRY,
      NO_TECHNIQUES:
        translated?.THERAPEUTIC_TECHNIQUES_NO_TECHNIQUES || TEXTS.NO_TECHNIQUES,
      NO_MATCH_FILTER:
        translated?.THERAPEUTIC_TECHNIQUES_NO_MATCH_FILTER ||
        TEXTS.NO_MATCH_FILTER,
      FILTER_BY_EMOTION:
        translated?.THERAPEUTIC_TECHNIQUES_FILTER_BY_EMOTION ||
        TEXTS.FILTER_BY_EMOTION,
      ALL_EMOTIONS:
        translated?.THERAPEUTIC_TECHNIQUES_ALL_EMOTIONS || TEXTS.ALL_EMOTIONS,
      EMOTION_FILTER_A11Y:
        translated?.THERAPEUTIC_TECHNIQUES_EMOTION_FILTER_A11Y ||
        TEXTS.EMOTION_FILTER_A11Y,
      EMOTION_FILTER_TOGGLE_SHOW:
        translated?.THERAPEUTIC_TECHNIQUES_EMOTION_FILTER_TOGGLE_SHOW ||
        TEXTS.EMOTION_FILTER_TOGGLE_SHOW,
      EMOTION_FILTER_TOGGLE_HIDE:
        translated?.THERAPEUTIC_TECHNIQUES_EMOTION_FILTER_TOGGLE_HIDE ||
        TEXTS.EMOTION_FILTER_TOGGLE_HIDE,
      SECTION_EXPAND:
        translated?.THERAPEUTIC_TECHNIQUES_SECTION_EXPAND ||
        TEXTS.SECTION_EXPAND,
      SECTION_COLLAPSE:
        translated?.THERAPEUTIC_TECHNIQUES_SECTION_COLLAPSE ||
        TEXTS.SECTION_COLLAPSE,
      CATEGORY_HINT_IMMEDIATE:
        translated?.THERAPEUTIC_TECHNIQUES_CATEGORY_HINT_IMMEDIATE ||
        TEXTS.CATEGORY_HINT_IMMEDIATE,
      CATEGORY_HINT_CBT:
        translated?.THERAPEUTIC_TECHNIQUES_CATEGORY_HINT_CBT ||
        TEXTS.CATEGORY_HINT_CBT,
      CATEGORY_HINT_DBT:
        translated?.THERAPEUTIC_TECHNIQUES_CATEGORY_HINT_DBT ||
        TEXTS.CATEGORY_HINT_DBT,
      CATEGORY_HINT_ACT:
        translated?.THERAPEUTIC_TECHNIQUES_CATEGORY_HINT_ACT ||
        TEXTS.CATEGORY_HINT_ACT,
      EMOTION_ALL:
        translated?.THERAPEUTIC_TECHNIQUES_EMOTION_ALL || TEXTS.EMOTION_ALL,
      EMOTION_SADNESS:
        translated?.THERAPEUTIC_TECHNIQUES_EMOTION_SADNESS ||
        TEXTS.EMOTION_SADNESS,
      EMOTION_ANXIETY:
        translated?.THERAPEUTIC_TECHNIQUES_EMOTION_ANXIETY ||
        TEXTS.EMOTION_ANXIETY,
      EMOTION_ANGER:
        translated?.THERAPEUTIC_TECHNIQUES_EMOTION_ANGER || TEXTS.EMOTION_ANGER,
      EMOTION_FEAR:
        translated?.THERAPEUTIC_TECHNIQUES_EMOTION_FEAR || TEXTS.EMOTION_FEAR,
      EMOTION_SHAME:
        translated?.THERAPEUTIC_TECHNIQUES_EMOTION_SHAME || TEXTS.EMOTION_SHAME,
      EMOTION_GUILT:
        translated?.THERAPEUTIC_TECHNIQUES_EMOTION_GUILT || TEXTS.EMOTION_GUILT,
      EMOTION_JOY:
        translated?.THERAPEUTIC_TECHNIQUES_EMOTION_JOY || TEXTS.EMOTION_JOY,
      EMOTION_HOPE:
        translated?.THERAPEUTIC_TECHNIQUES_EMOTION_HOPE || TEXTS.EMOTION_HOPE,
    }),
    [translated],
  );
}

/** Acento visual por categoría (tokens del tema; TechniqueCard / cabeceras). */
export function createCategoryAccent(colors) {
  return {
    [CATEGORIES.IMMEDIATE]: colors.warning,
    [CATEGORIES.CBT]: colors.primary,
    [CATEGORIES.DBT]: colors.error,
    [CATEGORIES.ACT]: colors.success,
  };
}

/** Compatibilidad: paleta clara. */
export const CATEGORY_ACCENT = createCategoryAccent(lightColors);

/** Una frase por categoría: qué aporta (visible aunque el acordeón esté cerrado). */
export function createCategoryHint(texts = TEXTS) {
  return {
    [CATEGORIES.IMMEDIATE]: texts.CATEGORY_HINT_IMMEDIATE,
    [CATEGORIES.CBT]: texts.CATEGORY_HINT_CBT,
    [CATEGORIES.DBT]: texts.CATEGORY_HINT_DBT,
    [CATEGORIES.ACT]: texts.CATEGORY_HINT_ACT,
  };
}

export const CATEGORY_HINT = createCategoryHint(TEXTS);

/** Orden de bloques en pantalla (prioridad visual). */
export const CATEGORY_ORDER = [
  CATEGORIES.IMMEDIATE,
  CATEGORIES.CBT,
  CATEGORIES.DBT,
  CATEGORIES.ACT,
];

export function createCategoryShortLabel(texts = TEXTS) {
  return {
    [CATEGORIES.IMMEDIATE]: texts.CATEGORY_IMMEDIATE_SHORT,
    [CATEGORIES.CBT]: texts.CATEGORY_CBT_SHORT,
    [CATEGORIES.DBT]: texts.CATEGORY_DBT_SHORT,
    [CATEGORIES.ACT]: texts.CATEGORY_ACT_SHORT,
  };
}

export const CATEGORY_SHORT_LABEL = createCategoryShortLabel(TEXTS);

export function createCategoryFullLabel(texts = TEXTS) {
  return {
    [CATEGORIES.IMMEDIATE]: texts.CATEGORY_IMMEDIATE,
    [CATEGORIES.CBT]: texts.CATEGORY_CBT,
    [CATEGORIES.DBT]: texts.CATEGORY_DBT,
    [CATEGORIES.ACT]: texts.CATEGORY_ACT,
  };
}

export const CATEGORY_FULL_LABEL = createCategoryFullLabel(TEXTS);

const EMOTION_DEFINITIONS = [
  { key: 'all', textKey: 'EMOTION_ALL', icon: 'emoticon-happy' },
  { key: 'tristeza', textKey: 'EMOTION_SADNESS', icon: 'emoticon-sad' },
  { key: 'ansiedad', textKey: 'EMOTION_ANXIETY', icon: 'emoticon-confused' },
  { key: 'enojo', textKey: 'EMOTION_ANGER', icon: 'emoticon-angry' },
  { key: 'miedo', textKey: 'EMOTION_FEAR', icon: 'emoticon-sick' },
  { key: 'verguenza', textKey: 'EMOTION_SHAME', icon: 'emoticon-neutral' },
  { key: 'culpa', textKey: 'EMOTION_GUILT', icon: 'emoticon-cry' },
  { key: 'alegria', textKey: 'EMOTION_JOY', icon: 'emoticon-happy' },
  { key: 'esperanza', textKey: 'EMOTION_HOPE', icon: 'emoticon-excited' },
];

export function createEmotionOptions(texts = TEXTS) {
  return EMOTION_DEFINITIONS.map((item) => ({
    key: item.key,
    label: texts[item.textKey],
    icon: item.icon,
  }));
}

export const EMOTIONS = createEmotionOptions(TEXTS);

export const EMOTION_KEYS = new Set(EMOTION_DEFINITIONS.map((e) => e.key));

/** Claves de acordeón válidas (evita estado raro si el mapa cambia). */
export const SECTION_KEYS = new Set(CATEGORY_ORDER);
