/**
 * Enlaces a redes y soporte externo según idioma de la interfaz.
 */

export const INSTAGRAM_URLS = {
  es: 'https://www.instagram.com/antoapp.es?igsh=YjU3MDB5bTkycjAz&utm_source=qr',
  en: 'https://www.instagram.com/antoapp.en?igsh=MTk0dGFlM2hldGpueA%3D%3D&utm_source=qr',
};

/**
 * @param {'es'|'en'|string} [language='es']
 * @returns {string}
 */
export function resolveInstagramUrl(language = 'es') {
  return String(language || 'es').toLowerCase().startsWith('en')
    ? INSTAGRAM_URLS.en
    : INSTAGRAM_URLS.es;
}
