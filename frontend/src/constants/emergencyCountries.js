/**
 * Países con números de emergencia en backend (ISO alpha-2).
 * Sin GPS: el usuario puede elegir país o dejar «Automático» (locale / zona horaria).
 */

export const COUNTRY_PREFERENCE_AUTO = '';

/** @type {{ iso: string, nameEs: string, nameEn: string }[]} */
export const EMERGENCY_COUNTRY_OPTIONS = [
  { iso: 'AR', nameEs: 'Argentina', nameEn: 'Argentina' },
  { iso: 'AU', nameEs: 'Australia', nameEn: 'Australia' },
  { iso: 'BO', nameEs: 'Bolivia', nameEn: 'Bolivia' },
  { iso: 'BR', nameEs: 'Brasil', nameEn: 'Brazil' },
  { iso: 'CA', nameEs: 'Canadá', nameEn: 'Canada' },
  { iso: 'CL', nameEs: 'Chile', nameEn: 'Chile' },
  { iso: 'CO', nameEs: 'Colombia', nameEn: 'Colombia' },
  { iso: 'CR', nameEs: 'Costa Rica', nameEn: 'Costa Rica' },
  { iso: 'DO', nameEs: 'República Dominicana', nameEn: 'Dominican Republic' },
  { iso: 'EC', nameEs: 'Ecuador', nameEn: 'Ecuador' },
  { iso: 'SV', nameEs: 'El Salvador', nameEn: 'El Salvador' },
  { iso: 'ES', nameEs: 'España', nameEn: 'Spain' },
  { iso: 'US', nameEs: 'Estados Unidos', nameEn: 'United States' },
  { iso: 'GT', nameEs: 'Guatemala', nameEn: 'Guatemala' },
  { iso: 'HN', nameEs: 'Honduras', nameEn: 'Honduras' },
  { iso: 'IE', nameEs: 'Irlanda', nameEn: 'Ireland' },
  { iso: 'MX', nameEs: 'México', nameEn: 'Mexico' },
  { iso: 'NI', nameEs: 'Nicaragua', nameEn: 'Nicaragua' },
  { iso: 'PA', nameEs: 'Panamá', nameEn: 'Panama' },
  { iso: 'PY', nameEs: 'Paraguay', nameEn: 'Paraguay' },
  { iso: 'PE', nameEs: 'Perú', nameEn: 'Peru' },
  { iso: 'GB', nameEs: 'Reino Unido', nameEn: 'United Kingdom' },
  { iso: 'UY', nameEs: 'Uruguay', nameEn: 'Uruguay' },
  { iso: 'VE', nameEs: 'Venezuela', nameEn: 'Venezuela' },
];

const ISO_TO_OPTION = Object.fromEntries(
  EMERGENCY_COUNTRY_OPTIONS.map((entry) => [entry.iso, entry]),
);

/**
 * @param {string|null|undefined} iso
 * @param {'es'|'en'} [language='es']
 * @returns {string|null}
 */
export function getEmergencyCountryLabel(iso, language = 'es') {
  if (!iso) return null;
  const upper = String(iso).trim().toUpperCase();
  const entry = ISO_TO_OPTION[upper];
  if (!entry) return upper;
  return language === 'en' ? entry.nameEn : entry.nameEs;
}

/**
 * @param {'es'|'en'} [language='es']
 * @returns {{ iso: string, nameEs: string, nameEn: string }[]}
 */
export function getSortedEmergencyCountries(language = 'es') {
  const locale = language === 'en' ? 'en' : 'es';
  return [...EMERGENCY_COUNTRY_OPTIONS].sort((a, b) => {
    const la = language === 'en' ? a.nameEn : a.nameEs;
    const lb = language === 'en' ? b.nameEn : b.nameEs;
    return la.localeCompare(lb, locale, { sensitivity: 'base' });
  });
}

/**
 * ISO efectivo para mostrar en fila (explícito o detectado).
 * @param {Object|null|undefined} preferences
 * @returns {string|null}
 */
export function resolveEffectiveCountryIso(preferences) {
  const explicit = preferences?.country;
  if (explicit != null && String(explicit).trim()) {
    return String(explicit).trim().toUpperCase();
  }
  const inferred = preferences?.regionCountry;
  if (inferred != null && String(inferred).trim()) {
    return String(inferred).trim().toUpperCase();
  }
  return null;
}

/**
 * Valor guardado en preferencias para el modal (vacío = automático).
 * @param {Object|null|undefined} preferences
 * @returns {string}
 */
export function resolveStoredCountryPreference(preferences) {
  const explicit = preferences?.country;
  if (explicit != null && String(explicit).trim()) {
    return String(explicit).trim().toUpperCase();
  }
  return COUNTRY_PREFERENCE_AUTO;
}

/**
 * Etiqueta de la fila en Ajustes.
 * @param {Object|null|undefined} preferences
 * @param {'es'|'en'} language
 * @param {{ COUNTRY_AUTO_LABEL: string, COUNTRY_DETECTED_SUFFIX: string }} texts
 */
export function formatCountryPreferenceRowLabel(preferences, language, texts) {
  const explicit = preferences?.country;
  if (explicit != null && String(explicit).trim()) {
    return (
      getEmergencyCountryLabel(explicit, language) || String(explicit).toUpperCase()
    );
  }
  const inferred = preferences?.regionCountry;
  if (inferred != null && String(inferred).trim()) {
    const name =
      getEmergencyCountryLabel(inferred, language) ||
      String(inferred).toUpperCase();
    return `${name} ${texts.COUNTRY_DETECTED_SUFFIX}`.trim();
  }
  return texts.COUNTRY_AUTO_LABEL;
}
