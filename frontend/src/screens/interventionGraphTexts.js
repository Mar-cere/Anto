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
