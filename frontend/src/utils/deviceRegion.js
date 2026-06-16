/**
 * Inferencia de país (ISO alpha-2) desde locale del dispositivo, sin GPS.
 */
import { getDeviceLocaleCandidates } from './appLanguage';

const LOCALE_REGION_TO_ISO = {
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

const KNOWN_ISO_COUNTRIES = new Set(Object.values(LOCALE_REGION_TO_ISO));

function inferIsoFromLocale(locale) {
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
 * @returns {string|null} ISO alpha-2 o null si no se puede inferir
 */
export function inferDeviceRegionCountry() {
  for (const locale of getDeviceLocaleCandidates()) {
    const iso = inferIsoFromLocale(locale);
    if (iso) return iso;
  }
  return null;
}
