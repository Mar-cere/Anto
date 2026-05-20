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

/**
 * Combina textos por defecto con claves de una sección de traducciones (función pura).
 * @param {Record<string, unknown>} translated
 * @param {Record<string, string>} defaults
 * @param {Record<string, string>} keyMap
 */
export function buildMappedSectionTexts(translated, defaults, keyMap) {
  const result = { ...defaults };
  Object.entries(keyMap).forEach(([localKey, translationKey]) => {
    const value = translated?.[translationKey];
    if (Array.isArray(value) && value.length > 0) {
      result[localKey] = value;
      return;
    }
    if (typeof value === 'string' && value.length > 0) {
      result[localKey] = value;
    }
  });
  return result;
}

/**
 * Combina textos por defecto con claves de una sección de traducciones.
 * @param {string} section - p. ej. 'PROFILE', 'TECHNIQUES'
 * @param {Record<string, string>} defaults - claves locales → texto fallback
 * @param {Record<string, string>} keyMap - claves locales → claves en la sección i18n
 */
export function useMappedSectionTexts(section, defaults, keyMap) {
  const translated = useSectionTranslations(section);
  return useMemo(
    () => buildMappedSectionTexts(translated, defaults, keyMap),
    [translated, defaults, keyMap],
  );
}
