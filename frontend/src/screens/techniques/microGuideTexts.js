import { useMemo } from 'react';
import { buildMappedSectionTexts, useSectionTranslations } from '../../hooks/useTranslations';

const DEFAULTS = {
  LIBRARY_TITLE: 'Micro-guías',
  LIBRARY_SUBTITLE: 'Prácticas breves paso a paso para el momento.',
  LOADING: 'Cargando guías…',
  ERROR: 'No se pudieron cargar las guías.',
  RETRY: 'Reintentar',
  EMPTY_LIST: 'No hay guías disponibles en este momento.',
  GUIDE_COUNT: '{n} guías',
  STEP_COUNT: '{n} pasos',
  READ_TIME: '~{n} min',
  HERO_KICKER: 'Biblioteca',
};

const KEY_MAP = {
  LIBRARY_TITLE: 'MICRO_GUIDE_LIBRARY_TITLE',
  LIBRARY_SUBTITLE: 'MICRO_GUIDE_LIBRARY_SUBTITLE',
  LOADING: 'MICRO_GUIDE_LIBRARY_LOADING',
  ERROR: 'MICRO_GUIDE_LIBRARY_ERROR',
  RETRY: 'MICRO_GUIDE_LIBRARY_RETRY',
  EMPTY_LIST: 'MICRO_GUIDE_LIBRARY_EMPTY',
  GUIDE_COUNT: 'MICRO_GUIDE_LIBRARY_COUNT',
  STEP_COUNT: 'MICRO_GUIDE_LIBRARY_STEPS',
  READ_TIME: 'MICRO_GUIDE_LIBRARY_READ_TIME',
  HERO_KICKER: 'MICRO_GUIDE_LIBRARY_HERO_KICKER',
};

export function parseMicroGuideBrowseResponse(res) {
  const raw = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
  return raw.filter((item) => {
    const guideId = String(item?.guideId || item?.interventionId || '').trim();
    return guideId.length > 0 && typeof item?.title === 'string' && item.title.trim().length > 0;
  });
}

export function useMicroGuideTexts() {
  const translated = useSectionTranslations('TECHNIQUES');
  return useMemo(() => buildMappedSectionTexts(translated, KEY_MAP, DEFAULTS), [translated]);
}
