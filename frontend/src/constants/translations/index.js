/**
 * Sistema de traducciones
 * 
 * Centraliza el manejo de traducciones de la aplicación.
 * Actualmente solo soporta español, pero está preparado para
 * agregar más idiomas en el futuro.
 * 
 * @author AntoApp Team
 */

import es from './es';
import en from './en';

export const DEFAULT_LANGUAGE = 'es';

export const SUPPORTED_LANGUAGES = ['es', 'en'];

const translations = {
  es,
  en,
};

export const LANGUAGE_LABELS = {
  es: { es: 'Español', en: 'Spanish' },
  en: { es: 'Inglés', en: 'English' },
};

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge(base, override) {
  if (!isObject(base) || !isObject(override)) return override ?? base;
  const merged = { ...base };
  Object.keys(override).forEach((key) => {
    merged[key] = deepMerge(base[key], override[key]);
  });
  return merged;
}

export const getSupportedLanguage = (language) =>
  SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE;

export const getLanguageLabel = (languageCode, displayLanguage = DEFAULT_LANGUAGE) => {
  const safeLanguageCode = getSupportedLanguage(languageCode);
  const safeDisplayLanguage = getSupportedLanguage(displayLanguage);
  return (
    LANGUAGE_LABELS[safeLanguageCode]?.[safeDisplayLanguage] ||
    LANGUAGE_LABELS[safeLanguageCode]?.[DEFAULT_LANGUAGE] ||
    safeLanguageCode
  );
};

/**
 * Obtiene las traducciones para un idioma específico
 * @param {string} language - Código del idioma (ej: 'es', 'en')
 * @returns {object} Objeto con las traducciones del idioma
 */
export const getTranslations = (language = DEFAULT_LANGUAGE) => {
  const safeLanguage = getSupportedLanguage(language);
  if (safeLanguage === DEFAULT_LANGUAGE) return translations[DEFAULT_LANGUAGE];
  return deepMerge(translations[DEFAULT_LANGUAGE], translations[safeLanguage]);
};

/**
 * Obtiene una traducción específica por clave
 * @param {string} key - Clave de la traducción (ej: 'HOME.WELCOME')
 * @param {string} language - Código del idioma (opcional)
 * @returns {string} Texto traducido
 */
export const t = (key, language = DEFAULT_LANGUAGE) => {
  const dictionary = getTranslations(language);
  const keys = key.split('.');
  let value = dictionary;

  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }
  
  return value;
};

export default getTranslations(DEFAULT_LANGUAGE);

