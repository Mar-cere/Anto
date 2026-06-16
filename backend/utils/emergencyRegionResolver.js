/**
 * Inferencia de país (ISO 3166-1 alpha-2) sin GPS: locale del dispositivo y zona horaria IANA.
 * Usado para números de emergencia cuando no hay país explícito ni teléfono inequívoco.
 */

/** Locales habituales → ISO (es-CL, en-US, pt-BR, …) */
export const LOCALE_REGION_TO_ISO = {
  'es-cl': 'CL',
  'es-ar': 'AR',
  'es-mx': 'MX',
  'es-co': 'CO',
  'es-pe': 'PE',
  'es-es': 'ES',
  'es-uy': 'UY',
  'es-ec': 'EC',
  'es-ve': 'VE',
  'es-bo': 'BO',
  'es-py': 'PY',
  'es-cr': 'CR',
  'es-gt': 'GT',
  'es-pa': 'PA',
  'es-hn': 'HN',
  'es-ni': 'NI',
  'es-sv': 'SV',
  'es-do': 'DO',
  'en-us': 'US',
  'en-gb': 'GB',
  'en-au': 'AU',
  'en-ca': 'CA',
  'en-ie': 'IE',
  'pt-br': 'BR',
};

/** Zonas horarias frecuentes → ISO (heurística; no sustituye preferencia explícita) */
export const TIMEZONE_TO_ISO = {
  'America/Santiago': 'CL',
  'America/Argentina/Buenos_Aires': 'AR',
  'America/Argentina/Cordoba': 'AR',
  'America/Mexico_City': 'MX',
  'America/Bogota': 'CO',
  'America/Lima': 'PE',
  'Europe/Madrid': 'ES',
  'America/Montevideo': 'UY',
  'America/Guayaquil': 'EC',
  'America/Caracas': 'VE',
  'America/La_Paz': 'BO',
  'America/Asuncion': 'PY',
  'America/Sao_Paulo': 'BR',
  'America/Costa_Rica': 'CR',
  'America/Guatemala': 'GT',
  'America/Panama': 'PA',
  'America/Tegucigalpa': 'HN',
  'America/Managua': 'NI',
  'America/El_Salvador': 'SV',
  'America/Santo_Domingo': 'DO',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Phoenix': 'US',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'Europe/London': 'GB',
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Europe/Dublin': 'IE',
};

/** ISO admitidos para validar sufijo de locale (es-XX) */
export const KNOWN_ISO_COUNTRIES = new Set([
  'CL', 'AR', 'MX', 'CO', 'PE', 'ES', 'US', 'EC', 'UY', 'PY', 'BR', 'GT', 'BO', 'CR', 'PA',
  'NI', 'HN', 'SV', 'VE', 'DO', 'GB', 'CA', 'AU', 'IE',
]);

/**
 * @param {string|null|undefined} locale
 * @returns {string|null} ISO alpha-2
 */
export function inferIsoCountryFromLocale(locale) {
  if (!locale) return null;
  const norm = String(locale).trim().toLowerCase().replace(/_/g, '-');
  if (LOCALE_REGION_TO_ISO[norm]) return LOCALE_REGION_TO_ISO[norm];

  const parts = norm.split('-');
  if (parts.length >= 2) {
    const region = parts[parts.length - 1].toUpperCase();
    if (region.length === 2 && KNOWN_ISO_COUNTRIES.has(region)) return region;
  }
  return null;
}

/**
 * @param {string|null|undefined} timezone
 * @returns {string|null} ISO alpha-2
 */
export function inferIsoCountryFromTimezone(timezone) {
  if (!timezone) return null;
  const tz = String(timezone).trim();
  return TIMEZONE_TO_ISO[tz] || null;
}

/**
 * Señales débiles guardadas en preferencias (sin GPS).
 * @param {Object|null|undefined} prefs
 * @returns {string|null}
 */
export function inferIsoCountryFromDeviceSignals(prefs) {
  const p = prefs || {};
  const region = p.regionCountry != null ? String(p.regionCountry).trim().toUpperCase() : '';
  if (region.length === 2 && KNOWN_ISO_COUNTRIES.has(region)) return region;
  return inferIsoCountryFromTimezone(p.timezone);
}
