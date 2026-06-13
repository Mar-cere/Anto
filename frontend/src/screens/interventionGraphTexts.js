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
  LIST_A11Y: 'Detalle de conexiones del grafo',
  MAP_A11Y: 'Mapa de conexiones entre temas e intervenciones',
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
  LIST_A11Y: 'INTERVENTION_GRAPH_LIST_A11Y',
  MAP_A11Y: 'INTERVENTION_GRAPH_MAP_A11Y',
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
