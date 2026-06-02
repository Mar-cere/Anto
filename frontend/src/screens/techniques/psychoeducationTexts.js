import { useMemo } from 'react';
import {
  buildMappedSectionTexts,
  useSectionTranslations,
} from '../../hooks/useTranslations';

const DEFAULTS = {
  LIBRARY_TITLE: 'Psicoeducación',
  LIBRARY_SUBTITLE: 'Módulos breves con lenguaje no diagnóstico y fuentes.',
  LOADING: 'Cargando módulos…',
  ERROR: 'No se pudieron cargar los módulos.',
  RETRY: 'Reintentar',
  EMPTY_LIST: 'No hay módulos disponibles en este momento.',
  MODULE_COUNT: '{n} módulos',
  READ_TIME: '~{n} min de lectura',
  HERO_KICKER: 'Biblioteca',
  DISCLAIMER_TITLE: 'Aviso importante',
  SOURCES_TITLE: 'Fuentes',
  OPEN_SOURCE: 'Abrir enlace',
  MODULE_DEFAULT_TITLE: 'Psicoeducación',
  NO_TOPIC: 'No se indicó un tema.',
  LOAD_MODULE_ERROR: 'No se pudo cargar el módulo.',
  MODULE_NOT_FOUND: 'No se encontró el módulo.',
  CARD_BADGE: 'Psicoeducación',
  CARD_CTA_READ: 'Leer módulo',
  CARD_MINUTES: '~{n} min',
  REVIEW_FOOTER: 'Contenido v{version} · revisión editorial ({date})',
  MECHANISM_TITLE: 'Por qué puede ayudar',
  SECTION_ITEMS_PREVIEW: '{n} puntos',
  SOURCES_COUNT: '{n} enlaces',
};

const KEY_MAP = {
  LIBRARY_TITLE: 'THERAPEUTIC_TECHNIQUES_PSYCHOED_LIBRARY',
  LIBRARY_SUBTITLE: 'THERAPEUTIC_TECHNIQUES_PSYCHOED_LIBRARY_HINT',
  LOADING: 'PSYCHOED_LOADING',
  ERROR: 'PSYCHOED_ERROR',
  RETRY: 'PSYCHOED_RETRY',
  EMPTY_LIST: 'PSYCHOED_EMPTY_LIST',
  MODULE_COUNT: 'PSYCHOED_MODULE_COUNT',
  READ_TIME: 'PSYCHOED_READ_TIME',
  HERO_KICKER: 'PSYCHOED_HERO_KICKER',
  DISCLAIMER_TITLE: 'PSYCHOED_DISCLAIMER_TITLE',
  SOURCES_TITLE: 'PSYCHOED_SOURCES_TITLE',
  OPEN_SOURCE: 'PSYCHOED_OPEN_SOURCE',
  MODULE_DEFAULT_TITLE: 'PSYCHOED_MODULE_DEFAULT_TITLE',
  NO_TOPIC: 'PSYCHOED_NO_TOPIC',
  LOAD_MODULE_ERROR: 'PSYCHOED_LOAD_MODULE_ERROR',
  MODULE_NOT_FOUND: 'PSYCHOED_MODULE_NOT_FOUND',
  CARD_BADGE: 'PSYCHOED_CARD_BADGE',
  CARD_CTA_READ: 'PSYCHOED_CARD_CTA_READ',
  CARD_MINUTES: 'PSYCHOED_CARD_MINUTES',
  REVIEW_FOOTER: 'PSYCHOED_REVIEW_FOOTER',
  MECHANISM_TITLE: 'PSYCHOED_MECHANISM_TITLE',
  SECTION_ITEMS_PREVIEW: 'PSYCHOED_SECTION_ITEMS_PREVIEW',
  SOURCES_COUNT: 'PSYCHOED_SOURCES_COUNT',
};

const TOPIC_KEY_MAP = {
  anxiety: 'PSYCHOED_TOPIC_anxiety',
  depression: 'PSYCHOED_TOPIC_depression',
  stress: 'PSYCHOED_TOPIC_stress',
  anger: 'PSYCHOED_TOPIC_anger',
  sleep: 'PSYCHOED_TOPIC_sleep',
  emotionRegulation: 'PSYCHOED_TOPIC_emotionRegulation',
  trauma: 'PSYCHOED_TOPIC_trauma',
};

export function formatReviewFooter(texts, clinicalReview) {
  if (!clinicalReview) return null;
  const version = clinicalReview.version || '1.0.0';
  const date = clinicalReview.reviewedAt || '';
  const line = texts.REVIEW_FOOTER.replace('{version}', version).replace('{date}', date);
  const note = String(clinicalReview.note || '').trim();
  return note ? `${line}\n${note}` : line;
}

export function usePsychoeducationTexts() {
  const translated = useSectionTranslations('TECHNIQUES');
  return useMemo(
    () => buildMappedSectionTexts(translated, DEFAULTS, KEY_MAP),
    [translated],
  );
}

export function topicTitle(texts, topic, translatedSection) {
  if (!topic) return texts.MODULE_DEFAULT_TITLE;
  const remoteKey = TOPIC_KEY_MAP[topic];
  const fromDict = remoteKey && translatedSection?.[remoteKey];
  if (typeof fromDict === 'string' && fromDict.trim()) return fromDict;
  return texts.MODULE_DEFAULT_TITLE;
}

/** Título localizado; prefiere `module.title` de la API si existe. */
export function resolveModuleTitle(texts, topic, module, translatedSection) {
  const apiTitle = String(module?.title || '').trim();
  if (apiTitle) return apiTitle;
  return topicTitle(texts, topic, translatedSection);
}
