import { DEFAULT_LANGUAGE, getTranslations } from '../constants/translations';
import { getCachedAppLanguage } from './appLanguage';

/**
 * Texto de una sección de traducciones para capas de servicio (sin React).
 * @param {string} section - p. ej. 'CHAT', 'API_ERRORS'
 * @param {string} key
 * @param {string} [language]
 * @returns {string}
 */
export function getSectionCopy(section, key, language) {
  const lang = language || getCachedAppLanguage();
  const dict = getTranslations(lang)?.[section];
  const fallback = getTranslations(DEFAULT_LANGUAGE)?.[section];
  const value = dict?.[key] ?? fallback?.[key];
  return typeof value === 'string' ? value : key;
}

/** @param {string} key @param {string} [language] */
export function getChatCopy(key, language) {
  return getSectionCopy('CHAT', key, language);
}

/** @param {string} key @param {string} [language] */
export function getApiErrorsCopy(key, language) {
  return getSectionCopy('API_ERRORS', key, language);
}
