/**
 * Normalización y validación de preferencias de país (sin GPS).
 */
import { KNOWN_ISO_COUNTRIES } from './emergencyRegionResolver.js';
import {
  ISO_COUNTRY_TO_DIAL_PREFIX,
  LEGACY_REGION_TO_ISO,
} from '../constants/emergencyNumbers.js';

/**
 * @param {unknown} value
 * @returns {string|null}
 */
export function sanitizeCountryPreference(value) {
  if (value == null || value === '') return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (KNOWN_ISO_COUNTRIES.has(upper)) return upper;
  if (Object.prototype.hasOwnProperty.call(LEGACY_REGION_TO_ISO, upper)) {
    const iso = LEGACY_REGION_TO_ISO[upper];
    return iso || null;
  }
  if (/^\d{1,3}$/.test(raw)) return raw;
  return null;
}

/**
 * @param {unknown} value
 * @returns {string|null}
 */
export function sanitizeRegionCountryPreference(value) {
  if (value == null || value === '') return null;
  const upper = String(value).trim().toUpperCase();
  if (upper.length === 2 && KNOWN_ISO_COUNTRIES.has(upper)) return upper;
  return null;
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidCountryPreference(value) {
  if (value == null || value === '') return true;
  return sanitizeCountryPreference(value) != null;
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidRegionCountryPreference(value) {
  if (value == null || value === '') return true;
  return sanitizeRegionCountryPreference(value) != null;
}

/**
 * @param {Object|null|undefined} prefs
 * @returns {Object|null|undefined}
 */
export function normalizeCountryPreferences(prefs) {
  if (!prefs || typeof prefs !== 'object') return prefs;
  const next = { ...prefs };
  if ('country' in next) {
    next.country = sanitizeCountryPreference(next.country);
  }
  if ('regionCountry' in next) {
    next.regionCountry = sanitizeRegionCountryPreference(next.regionCountry);
  }
  return next;
}

/**
 * ISO admitidos para validación Joi (lista estable).
 * @returns {string[]}
 */
export function getKnownIsoCountryCodes() {
  return [...KNOWN_ISO_COUNTRIES];
}

export { ISO_COUNTRY_TO_DIAL_PREFIX };
