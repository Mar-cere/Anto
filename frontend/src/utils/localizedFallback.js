/**
 * Fallbacks de texto según idioma cuando falla la carga de traducciones.
 */
export function pickLocalizedDefaults(language, defaultsByLang) {
  const lang = language === 'en' ? 'en' : 'es';
  return defaultsByLang[lang] || defaultsByLang.es || {};
}

export function resolveLocalizedFallback(translated, translationKey, defaultsByLang, language) {
  const fromCatalog = translated?.[translationKey];
  if (fromCatalog) return fromCatalog;
  const defaults = pickLocalizedDefaults(language, defaultsByLang);
  return defaults[translationKey] ?? '';
}
