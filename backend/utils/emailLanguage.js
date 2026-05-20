/**
 * Idioma de correos de producto (es/en), alineado con resolveAppLanguage del cliente.
 */
import { resolveAppLanguage } from './resolveAppLanguage.js';

export function normalizeEmailLanguage(value) {
  const code = String(value || '').slice(0, 2).toLowerCase();
  return code === 'en' ? 'en' : 'es';
}

/**
 * @param {object|null|undefined} user — documento User (puede incluir preferences.language)
 * @param {string} [fallback='es']
 */
export function resolveUserEmailLanguage(user, fallback = 'es') {
  const fromUser = user?.preferences?.language;
  if (fromUser) {
    return normalizeEmailLanguage(fromUser);
  }
  return normalizeEmailLanguage(fallback);
}

/**
 * @param {import('express').Request} [req]
 * @param {object|null} [user]
 */
export function resolveEmailLanguageFromRequest(req, user) {
  return resolveAppLanguage({
    headerLanguage: req?.get?.('X-App-Language'),
    preferenceLanguage: user?.preferences?.language,
    acceptLanguage: req?.get?.('Accept-Language'),
  });
}

export function emailDateLocale(language) {
  return normalizeEmailLanguage(language) === 'en' ? 'en-US' : 'es-CL';
}
