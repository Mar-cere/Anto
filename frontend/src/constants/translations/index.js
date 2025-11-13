/**
 * Sistema de traducciones
 * 
 * Centraliza el manejo de traducciones de la aplicación.
 * Actualmente solo soporta español, pero está preparado para
 * agregar más idiomas en el futuro.
 * 
 * @author AntoApp Team
 */

import es, { DASH, HOME, REGISTER } from './es';

// Idioma por defecto
const DEFAULT_LANGUAGE = 'es';

// Mapa de idiomas disponibles
const translations = {
  es,
};

// Re-exportar traducciones específicas para facilitar el uso
export { DASH, HOME, REGISTER };

/**
 * Obtiene las traducciones para un idioma específico
 * @param {string} language - Código del idioma (ej: 'es', 'en')
 * @returns {object} Objeto con las traducciones del idioma
 */
export const getTranslations = (language = DEFAULT_LANGUAGE) => {
  return translations[language] || translations[DEFAULT_LANGUAGE];
};

/**
 * Obtiene una traducción específica por clave
 * @param {string} key - Clave de la traducción (ej: 'HOME.WELCOME')
 * @param {string} language - Código del idioma (opcional)
 * @returns {string} Texto traducido
 */
export const t = (key, language = DEFAULT_LANGUAGE) => {
  const translations = getTranslations(language);
  const keys = key.split('.');
  let value = translations;
  
  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }
  
  return value;
};

// Exportar traducciones por defecto
export default getTranslations(DEFAULT_LANGUAGE);

