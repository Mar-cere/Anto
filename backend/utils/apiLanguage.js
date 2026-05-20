/**
 * Resolución de idioma para respuestas de API (es/en).
 */
import { resolveAppLanguage } from './resolveAppLanguage.js';

export function normalizeApiLanguage(language) {
  return language === 'en' ? 'en' : 'es';
}

export function resolveRequestLanguage(req) {
  return resolveAppLanguage({
    headerLanguage: req.headers['x-app-language'],
    queryLanguage: req.query?.language,
    acceptLanguage: req.headers['accept-language'],
    preferenceLanguage: req.user?.preferences?.language,
  });
}
