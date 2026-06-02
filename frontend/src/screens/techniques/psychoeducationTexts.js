import { useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const TEXTS = {
  es: {
    LIBRARY_TITLE: 'Psicoeducación',
    LIBRARY_SUBTITLE: 'Módulos breves con lenguaje no diagnóstico y fuentes.',
    LOADING: 'Cargando módulos…',
    ERROR: 'No se pudieron cargar los módulos.',
    RETRY: 'Reintentar',
    DISCLAIMER_TITLE: 'Aviso importante',
    SOURCES_TITLE: 'Fuentes',
    OPEN_SOURCE: 'Abrir enlace',
    MODULE_DEFAULT_TITLE: 'Psicoeducación',
    TOPIC_anxiety: 'Ansiedad',
    TOPIC_depression: 'Bajo ánimo',
    TOPIC_stress: 'Estrés',
    TOPIC_anger: 'Enojo e ira',
    TOPIC_sleep: 'Sueño',
    TOPIC_emotionRegulation: 'Regulación emocional',
    TOPIC_trauma: 'Experiencias difíciles',
    NO_TOPIC: 'No se indicó un tema.',
    LOAD_MODULE_ERROR: 'No se pudo cargar el módulo.',
    MODULE_NOT_FOUND: 'No se encontró el módulo.',
    CARD_BADGE: 'Psicoeducación',
    CARD_CTA_READ: 'Leer módulo',
    CARD_MINUTES: '~{n} min',
    REVIEW_FOOTER: 'Contenido v{version} · revisión editorial ({date})',
    MECHANISM_TITLE: 'Por qué puede ayudar',
  },
  en: {
    LIBRARY_TITLE: 'Psychoeducation',
    LIBRARY_SUBTITLE: 'Short modules with non-diagnostic language and sources.',
    LOADING: 'Loading modules…',
    ERROR: 'Could not load modules.',
    RETRY: 'Retry',
    DISCLAIMER_TITLE: 'Important notice',
    SOURCES_TITLE: 'Sources',
    OPEN_SOURCE: 'Open link',
    MODULE_DEFAULT_TITLE: 'Psychoeducation',
    TOPIC_anxiety: 'Anxiety',
    TOPIC_depression: 'Low mood',
    TOPIC_stress: 'Stress',
    TOPIC_anger: 'Anger',
    TOPIC_sleep: 'Sleep',
    TOPIC_emotionRegulation: 'Emotion regulation',
    TOPIC_trauma: 'Difficult experiences',
    NO_TOPIC: 'No topic was specified.',
    LOAD_MODULE_ERROR: 'Could not load the module.',
    MODULE_NOT_FOUND: 'Module not found.',
    CARD_BADGE: 'Psychoeducation',
    CARD_CTA_READ: 'Read module',
    CARD_MINUTES: '~{n} min',
    REVIEW_FOOTER: 'Content v{version} · editorial review ({date})',
    MECHANISM_TITLE: 'Why this may help',
  },
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
  const { language } = useLanguage();
  return useMemo(() => TEXTS[language === 'en' ? 'en' : 'es'], [language]);
}

export function topicTitle(texts, topic) {
  if (!topic) return texts.MODULE_DEFAULT_TITLE;
  return texts[`TOPIC_${topic}`] || texts.MODULE_DEFAULT_TITLE;
}
