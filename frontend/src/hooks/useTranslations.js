import { useCallback, useMemo } from 'react';
import { DEFAULT_LANGUAGE, getTranslations, t as translate } from '../constants/translations';
import { useLanguage } from '../context/LanguageContext';

export function useTranslations() {
  const { language, setLanguage, availableLanguages } = useLanguage();
  const translations = useMemo(() => getTranslations(language), [language]);
  const t = useCallback((key) => translate(key, language), [language]);

  return {
    language,
    setLanguage,
    availableLanguages,
    translations,
    t,
  };
}

export function useSectionTranslations(section) {
  const { translations } = useTranslations();
  const fallback = getTranslations(DEFAULT_LANGUAGE);
  return translations?.[section] || fallback?.[section] || {};
}
