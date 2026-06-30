import { useMemo } from 'react';
import {
  AI_LIMIT_LIBRARY_ORDER,
  isValidAiLimitTopicId,
} from '../constants/aiCompetenceLimits';
import { useSectionTranslations } from './useTranslations';

function normalizeTopic(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  const body = typeof raw.body === 'string' ? raw.body.trim() : '';
  if (!title || !body) return null;
  const bullets = Array.isArray(raw.bullets)
    ? raw.bullets.filter((b) => typeof b === 'string' && b.trim()).map((b) => b.trim())
    : [];
  return { title, body, bullets };
}

const EMPTY_TOPIC = {
  title: '',
  body: '',
  bullets: [],
  hasContent: false,
};

export function useAiLimitTopic(topicId) {
  const info = useSectionTranslations('INFO');
  const lib = info?.AI_LIMITS_LIBRARY;
  const resolvedTopicId = isValidAiLimitTopicId(topicId) ? topicId : null;

  return useMemo(() => {
    const sheetMeta = {
      hintA11y: lib?.HINT_A11Y || 'Más sobre los límites de Anto',
      sheetClose: lib?.SHEET_CLOSE || 'Cerrar',
      sheetOpenLibrary: lib?.SHEET_OPEN_LIBRARY || 'Ver biblioteca completa',
      libraryTitle: lib?.SECTION_TITLE || '',
      libraryIntro: lib?.SECTION_INTRO || '',
    };

    if (!resolvedTopicId) {
      return { topicId, ...EMPTY_TOPIC, ...sheetMeta };
    }

    const topic = normalizeTopic(lib?.TOPICS?.[resolvedTopicId]);
    return {
      topicId: resolvedTopicId,
      title: topic?.title || '',
      body: topic?.body || '',
      bullets: topic?.bullets || [],
      ...sheetMeta,
      hasContent: Boolean(topic),
    };
  }, [lib, topicId, resolvedTopicId]);
}

export function useAiLimitsLibrary() {
  const info = useSectionTranslations('INFO');
  const lib = info?.AI_LIMITS_LIBRARY;

  return useMemo(() => {
    const topics = AI_LIMIT_LIBRARY_ORDER.map((id) => {
      const topic = normalizeTopic(lib?.TOPICS?.[id]);
      if (!topic) return null;
      return { id, ...topic };
    }).filter(Boolean);

    return {
      sectionTitle: lib?.SECTION_TITLE || '',
      sectionIntro: lib?.SECTION_INTRO || '',
      topics,
    };
  }, [lib]);
}
