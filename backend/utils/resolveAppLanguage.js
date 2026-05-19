/**
 * Resuelve idioma de la app (es/en) desde header, query o preferencias guardadas.
 */
export function resolveAppLanguage({
  headerLanguage,
  queryLanguage,
  preferenceLanguage,
  acceptLanguage,
  defaultLanguage = 'es',
} = {}) {
  const fromHeader = normalizeLanguageCode(headerLanguage);
  if (fromHeader) return fromHeader;

  const fromQuery = normalizeLanguageCode(queryLanguage);
  if (fromQuery) return fromQuery;

  const fromPreference = normalizeLanguageCode(preferenceLanguage);
  if (fromPreference) return fromPreference;

  const accept = String(acceptLanguage || '').toLowerCase();
  if (accept.startsWith('en')) return 'en';
  if (accept.startsWith('es')) return 'es';

  return defaultLanguage === 'en' ? 'en' : 'es';
}

function normalizeLanguageCode(value) {
  const code = String(value || '').slice(0, 2).toLowerCase();
  if (code === 'en' || code === 'es') return code;
  return null;
}
