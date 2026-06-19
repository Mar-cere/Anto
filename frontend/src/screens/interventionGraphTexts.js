import { useMemo } from 'react';
import { useSectionTranslations } from '../hooks/useTranslations';

const DEFAULTS = {
  TITLE: 'Lo que te ayuda',
  META: 'Basado en tu actividad de los últimos {days} días',
  ERROR: 'No pudimos cargar esta vista. Inténtalo de nuevo.',
  RETRY: 'Reintentar',
  EMPTY: 'Aún no hay suficiente actividad. Chatea con Anto y prueba una técnica cuando te la sugiera.',
  METRICS: 'mostradas {shown} · clic {clicked} · descartadas {dismissed} · hechas {completed}',
  RATES: 'CTR {ctr} · completación {completion}',
  DEV_LINK: 'Grafo de sugerencias del chat (interno)',
  ENTRY_LINK: 'Lo que te ayuda',
  VIEW_GRAPH: 'Mapa',
  VIEW_LIST: 'Lista',
  LEGEND: 'Las líneas más marcadas son las conexiones que más has usado.',
  LEGEND_TOPIC_FREE: 'Lo que compartiste en el chat y las técnicas que probaste después.',
  TOPIC_FREE_SECTION: 'De tus conversaciones',
  EMBEDDINGS_ON: 'Ranking semántico activo (embeddings topicFree).',
  VECTOR_ATLAS_ON: 'Búsqueda vectorial Atlas activa para afinidad semántica.',
  VECTOR_SCAN_ON: 'Afinidad semántica activa (modo scan local).',
  LEGEND_CONCEPT: 'Ideas parecidas de tus mensajes agrupadas con las técnicas que más te sirven.',
  INSIGHTS_TITLE: 'Patrones que vamos notando',
  INSIGHTS_DISCLAIMER: 'Son tendencias de tu uso en la app, no un diagnóstico.',
  INSIGHT_TOPIC_INTERVENTION: 'Cuando aparece {topic}, suele ayudarte {intervention}',
  INSIGHT_CONCEPT_INTERVENTION: 'Cuando hablas de «{concept}», a menudo usas {intervention}',
  INSIGHT_TOPIC_MOOD_LIFT:
    'En días de {topic}, tu ánimo suele mejorar después de activación conductual (~{delta})',
  INSIGHT_TOPIC_MOOD_DIP:
    'En días de {topic}, tu ánimo suele bajar un poco tras activación conductual (~{delta})',
  ROW_CONTEXT: 'Cuando hablas de {topic}',
  STATUS_COMPLETED: 'Ya lo probaste y lo completaste',
  STATUS_COMPLETED_REPEAT: 'Lo completaste {n} veces',
  STATUS_EXPLORED: 'Lo abriste para explorarlo',
  STATUS_DISMISSED: 'Lo descartaste en su momento',
  STATUS_SUGGESTED: 'Te lo sugerimos en el chat',
  LIST_A11Y: 'Conexiones entre tus temas y técnicas',
  MAP_A11Y: 'Mapa de lo que te ayuda',
  MAP_SOURCE_COL: 'Lo que compartes',
  MAP_TARGET_COL: 'Técnicas',
  ORIGINAL_SNIPPET: 'Tal como lo escribiste',
  MAP_TAP_HINT: 'Toca una conexión para ver más detalle.',
};

const KEY_MAP = {
  TITLE: 'INTERVENTION_GRAPH_TITLE',
  META: 'INTERVENTION_GRAPH_META',
  ERROR: 'INTERVENTION_GRAPH_ERROR',
  RETRY: 'INTERVENTION_GRAPH_RETRY',
  EMPTY: 'INTERVENTION_GRAPH_EMPTY',
  METRICS: 'INTERVENTION_GRAPH_METRICS',
  RATES: 'INTERVENTION_GRAPH_RATES',
  DEV_LINK: 'INTERVENTION_GRAPH_DEV_LINK',
  ENTRY_LINK: 'INTERVENTION_GRAPH_ENTRY_LINK',
  VIEW_GRAPH: 'INTERVENTION_GRAPH_VIEW_GRAPH',
  VIEW_LIST: 'INTERVENTION_GRAPH_VIEW_LIST',
  LEGEND: 'INTERVENTION_GRAPH_LEGEND',
  LEGEND_TOPIC_FREE: 'INTERVENTION_GRAPH_LEGEND_TOPIC_FREE',
  TOPIC_FREE_SECTION: 'INTERVENTION_GRAPH_TOPIC_FREE_SECTION',
  EMBEDDINGS_ON: 'INTERVENTION_GRAPH_EMBEDDINGS_ON',
  VECTOR_ATLAS_ON: 'INTERVENTION_GRAPH_VECTOR_ATLAS_ON',
  VECTOR_SCAN_ON: 'INTERVENTION_GRAPH_VECTOR_SCAN_ON',
  LEGEND_CONCEPT: 'INTERVENTION_GRAPH_LEGEND_CONCEPT',
  INSIGHTS_TITLE: 'INTERVENTION_GRAPH_INSIGHTS_TITLE',
  INSIGHTS_DISCLAIMER: 'INTERVENTION_GRAPH_INSIGHTS_DISCLAIMER',
  INSIGHT_TOPIC_INTERVENTION: 'INTERVENTION_GRAPH_INSIGHT_TOPIC_INTERVENTION',
  INSIGHT_CONCEPT_INTERVENTION: 'INTERVENTION_GRAPH_INSIGHT_CONCEPT_INTERVENTION',
  INSIGHT_TOPIC_MOOD_LIFT: 'INTERVENTION_GRAPH_INSIGHT_TOPIC_MOOD_LIFT',
  INSIGHT_TOPIC_MOOD_DIP: 'INTERVENTION_GRAPH_INSIGHT_TOPIC_MOOD_DIP',
  ROW_CONTEXT: 'INTERVENTION_GRAPH_ROW_CONTEXT',
  STATUS_COMPLETED: 'INTERVENTION_GRAPH_STATUS_COMPLETED',
  STATUS_COMPLETED_REPEAT: 'INTERVENTION_GRAPH_STATUS_COMPLETED_REPEAT',
  STATUS_EXPLORED: 'INTERVENTION_GRAPH_STATUS_EXPLORED',
  STATUS_DISMISSED: 'INTERVENTION_GRAPH_STATUS_DISMISSED',
  STATUS_SUGGESTED: 'INTERVENTION_GRAPH_STATUS_SUGGESTED',
  LIST_A11Y: 'INTERVENTION_GRAPH_LIST_A11Y',
  MAP_A11Y: 'INTERVENTION_GRAPH_MAP_A11Y',
  MAP_SOURCE_COL: 'INTERVENTION_GRAPH_MAP_SOURCE_COL',
  MAP_TARGET_COL: 'INTERVENTION_GRAPH_MAP_TARGET_COL',
  MAP_TAP_HINT: 'INTERVENTION_GRAPH_MAP_TAP_HINT',
  ORIGINAL_SNIPPET: 'INTERVENTION_GRAPH_ORIGINAL_SNIPPET',
};

export function useInterventionGraphTexts() {
  const translated = useSectionTranslations('TECHNIQUES');
  return useMemo(() => {
    const t = { ...DEFAULTS };
    Object.entries(KEY_MAP).forEach(([local, remote]) => {
      if (translated?.[remote]) t[local] = translated[remote];
    });
    return t;
  }, [translated]);
}

export function formatGraphMeta(texts, days) {
  return String(texts.META || DEFAULTS.META).replace('{days}', String(days));
}

/** @deprecated Solo tests / diagnóstico interno */
export function formatGraphMetrics(texts, edge) {
  return String(texts.METRICS || '')
    .replace('{shown}', String(edge.shown ?? 0))
    .replace('{clicked}', String(edge.clicked ?? 0))
    .replace('{dismissed}', String(edge.dismissed ?? 0))
    .replace('{completed}', String(edge.completed ?? 0));
}

/** @deprecated Solo tests / diagnóstico interno */
export function formatGraphRates(texts, edge, pctFn) {
  return String(texts.RATES || '')
    .replace('{ctr}', pctFn(edge.ctr))
    .replace('{completion}', pctFn(edge.completionRate));
}

export function stripTechnicalInterventionSuffix(label) {
  return String(label || '')
    .replace(/\s*\((psicoeducación|psicoed|micro-guía|micro-guia|tcc|interno)\)\s*$/i, '')
    .trim();
}

export function formatGraphRowContext(texts, topicLabel) {
  const topic = String(topicLabel || '').replace(/^["«]|["»]$/g, '').trim();
  return String(texts.ROW_CONTEXT || DEFAULTS.ROW_CONTEXT).replace('{topic}', topic);
}

export function formatGraphHumanStatus(texts, edge) {
  const completed = Number(edge?.completed) || 0;
  const clicked = Number(edge?.clicked) || 0;
  const dismissed = Number(edge?.dismissed) || 0;
  const shown = Number(edge?.shown) || 0;

  if (completed > 1) {
    return String(texts.STATUS_COMPLETED_REPEAT || DEFAULTS.STATUS_COMPLETED_REPEAT).replace(
      '{n}',
      String(completed),
    );
  }
  if (completed === 1) return texts.STATUS_COMPLETED || DEFAULTS.STATUS_COMPLETED;
  if (clicked > 0) return texts.STATUS_EXPLORED || DEFAULTS.STATUS_EXPLORED;
  if (dismissed > 0) return texts.STATUS_DISMISSED || DEFAULTS.STATUS_DISMISSED;
  if (shown > 0) return texts.STATUS_SUGGESTED || DEFAULTS.STATUS_SUGGESTED;
  return '';
}

export function formatCorrelationInsight(texts, row, language = 'es') {
  const topicLabel =
    row?.sourceKind === 'topicTag'
      ? formatTopicTagLabel(row.sourceId, language)
      : row?.sourceLabel || row?.sourceId || '';
  const intervention = stripTechnicalInterventionSuffix(
    row?.interventionLabel || row?.targetId || '',
  );
  const delta = Math.abs(
    Number(row?.metrics?.avgMoodDeltaOnTopicDays || 0) -
      Number(row?.metrics?.avgMoodDeltaOverall || 0),
  ).toFixed(1);

  if (row?.type === 'concept_intervention') {
    return String(texts.INSIGHT_CONCEPT_INTERVENTION || '')
      .replace('{concept}', topicLabel)
      .replace('{intervention}', intervention);
  }
  if (row?.type === 'topic_mood_ba') {
    const template =
      row.direction === 'dip' ? texts.INSIGHT_TOPIC_MOOD_DIP : texts.INSIGHT_TOPIC_MOOD_LIFT;
    return String(template || '')
      .replace('{topic}', topicLabel)
      .replace('{delta}', delta);
  }
  return String(texts.INSIGHT_TOPIC_INTERVENTION || '')
    .replace('{topic}', topicLabel)
    .replace('{intervention}', intervention);
}

function formatTopicTagLabel(topicTag, language) {
  const tag = String(topicTag || 'general').trim().toLowerCase();
  const labels = {
    es: {
      general: 'temas variados',
      trabajo: 'trabajo',
      ansiedad: 'ansiedad',
      tristeza: 'tristeza',
      enojo: 'enojo',
      sueno: 'sueño',
      sleep: 'sueño',
      stress: 'estrés',
      relaciones: 'relaciones',
      familia: 'familia',
    },
    en: {
      general: 'varied topics',
      trabajo: 'work',
      ansiedad: 'anxiety',
      tristeza: 'low mood',
      enojo: 'anger',
      sueno: 'sleep',
      sleep: 'sleep',
      stress: 'stress',
      relaciones: 'relationships',
      familia: 'family',
    },
  };
  const lang = language === 'en' ? 'en' : 'es';
  return labels[lang][tag] || tag;
}
