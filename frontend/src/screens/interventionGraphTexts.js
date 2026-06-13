import { useMemo } from 'react';
import { useSectionTranslations } from '../hooks/useTranslations';

const DEFAULTS = {
  TITLE: 'Grafo de intervenciones',
  META: 'Ventana: últimos {days} días · métricas por sesión (mostradas/clic/hecho)',
  ERROR: 'No se pudo cargar el grafo de intervenciones.',
  RETRY: 'Reintentar',
  EMPTY: 'Sin datos aún. Usa sugerencias del chat y completa técnicas.',
  METRICS: 'mostradas {shown} · clic {clicked} · descartadas {dismissed} · hechas {completed}',
  RATES: 'CTR {ctr} · completación {completion}',
  DEV_LINK: 'Grafo de sugerencias del chat (interno)',
  ENTRY_LINK: 'Tu mapa de temas e intervenciones',
  VIEW_GRAPH: 'Mapa visual',
  VIEW_LIST: 'Lista',
  LEGEND: 'Grosor de la línea ≈ frecuencia y completación. Toca una conexión para ver detalle.',
  LEGEND_TOPIC_FREE:
    'Líneas punteadas: lo que escribiste en el chat → técnica que usaste. Grosor ≈ frecuencia.',
  TOPIC_FREE_SECTION: 'Tus mensajes en el chat',
  EMBEDDINGS_ON: 'Ranking semántico activo (embeddings topicFree).',
  VECTOR_ATLAS_ON: 'Búsqueda vectorial Atlas activa para afinidad semántica.',
  VECTOR_SCAN_ON: 'Afinidad semántica activa (modo scan local).',
  LEGEND_CONCEPT:
    'Nodos agrupados: ideas similares de tus mensajes → técnica. Líneas finas ≈ correlación observada.',
  INSIGHTS_TITLE: 'Patrones observados',
  INSIGHTS_DISCLAIMER: 'Correlaciones, no causas. Requiere más datos para ser fiables.',
  INSIGHT_TOPIC_INTERVENTION: 'Con {topic} suele ayudarte {intervention}',
  INSIGHT_CONCEPT_INTERVENTION: 'Cuando hablas de «{concept}», a menudo usas {intervention}',
  INSIGHT_TOPIC_MOOD_LIFT: 'En días de {topic}, tu ánimo tras BA sube ~{delta}',
  INSIGHT_TOPIC_MOOD_DIP: 'En días de {topic}, tu ánimo tras BA baja ~{delta}',
  LIST_A11Y: 'Detalle de conexiones del grafo',
  MAP_A11Y: 'Mapa de conexiones entre temas e intervenciones',
  MAP_SOURCE_COL: 'Tus ideas en el chat',
  MAP_TARGET_COL: 'Técnicas',
  MAP_TAP_HINT: 'Toca una conexión o un nodo para ver el detalle.',
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
  LIST_A11Y: 'INTERVENTION_GRAPH_LIST_A11Y',
  MAP_A11Y: 'INTERVENTION_GRAPH_MAP_A11Y',
  MAP_SOURCE_COL: 'INTERVENTION_GRAPH_MAP_SOURCE_COL',
  MAP_TARGET_COL: 'INTERVENTION_GRAPH_MAP_TARGET_COL',
  MAP_TAP_HINT: 'INTERVENTION_GRAPH_MAP_TAP_HINT',
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

export function formatGraphMetrics(texts, edge) {
  return String(texts.METRICS || '')
    .replace('{shown}', String(edge.shown ?? 0))
    .replace('{clicked}', String(edge.clicked ?? 0))
    .replace('{dismissed}', String(edge.dismissed ?? 0))
    .replace('{completed}', String(edge.completed ?? 0));
}

export function formatGraphRates(texts, edge, pctFn) {
  return String(texts.RATES || '')
    .replace('{ctr}', pctFn(edge.ctr))
    .replace('{completion}', pctFn(edge.completionRate));
}

export function formatCorrelationInsight(texts, row, language = 'es') {
  const topicLabel =
    row?.sourceKind === 'topicTag'
      ? formatTopicTagLabel(row.sourceId, language)
      : row?.sourceLabel || row?.sourceId || '';
  const intervention = row?.interventionLabel || row?.targetId || '';
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
      general: 'temas generales',
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
      general: 'general topics',
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
