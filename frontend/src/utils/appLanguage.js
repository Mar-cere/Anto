/**
 * Idioma de la app: detección del dispositivo, persistencia y sincronización con cuenta.
 *
 * Prioridad sin fricción:
 * - Sin preferencia guardada → idioma del dispositivo (`es` solo si el locale es español; cualquier otro → `en`).
 * - Primera resolución → se persiste en AsyncStorage para UI, API y notificaciones.
 * - Cambio en Ajustes → marca preferencia manual y sincroniza con el servidor.
 * - Tras login: si el usuario eligió idioma en Ajustes (manual) o el perfil está en inglés, se respeta el servidor.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';
import { DEFAULT_LANGUAGE, getSupportedLanguage } from '../constants/translations';

export const APP_LANGUAGE_STORAGE_KEY = 'preferences:language';
export const APP_LANGUAGE_MANUAL_KEY = 'preferences:language:manual';

const listeners = new Set();

/** Idioma en memoria para mensajes de servicio sin await (se actualiza al persistir). */
let cachedAppLanguage = detectDeviceLanguage();

export function getCachedAppLanguage() {
  return cachedAppLanguage;
}

function setCachedAppLanguage(language) {
  cachedAppLanguage = getSupportedLanguage(language);
}

function notifyListeners(language) {
  listeners.forEach((listener) => {
    try {
      listener(language);
    } catch (_) {
      // noop
    }
  });
}

/**
 * Locales nativos iOS/Android (más fiables que Intl en React Native).
 * @returns {string[]}
 */
function getReactNativeLocales() {
  try {
    if (Platform.OS === 'ios') {
      const settings = NativeModules.SettingsManager?.settings;
      if (settings?.AppleLocale) return [settings.AppleLocale];
      if (Array.isArray(settings?.AppleLanguages) && settings.AppleLanguages[0]) {
        return [settings.AppleLanguages[0]];
      }
    }
    if (Platform.OS === 'android') {
      const locale = NativeModules.I18nManager?.localeIdentifier;
      if (locale) return [locale];
    }
  } catch (_) {
    // noop
  }
  return [];
}

/**
 * Locales del dispositivo (nativo + Intl + navigator).
 * @returns {string[]}
 */
export function getDeviceLocaleCandidates() {
  const candidates = [...getReactNativeLocales()];
  try {
    const intlLocale = Intl?.DateTimeFormat?.().resolvedOptions?.().locale;
    if (intlLocale) candidates.push(intlLocale);
  } catch (_) {
    // noop
  }
  try {
    if (typeof navigator !== 'undefined' && navigator.language) {
      candidates.push(navigator.language);
    }
    if (typeof navigator !== 'undefined' && Array.isArray(navigator.languages)) {
      candidates.push(...navigator.languages);
    }
  } catch (_) {
    // noop
  }
  return [...new Set(candidates.filter(Boolean))];
}

/**
 * Español solo si algún locale del dispositivo es claramente español.
 * Cualquier otro idioma (en, pt, ja, ru, vacío…) → inglés como respaldo internacional.
 * @returns {'es'|'en'}
 */
export function detectDeviceLanguage() {
  const candidates = getDeviceLocaleCandidates();
  for (const raw of candidates) {
    const code = String(raw || '').toLowerCase().replace(/_/g, '-');
    if (code === 'es' || code.startsWith('es-')) {
      return 'es';
    }
  }
  return 'en';
}

export async function readStoredAppLanguage() {
  try {
    const stored = await AsyncStorage.getItem(APP_LANGUAGE_STORAGE_KEY);
    if (!stored) return null;
    const safe = getSupportedLanguage(stored);
    if (safe === stored) return safe;
    return null;
  } catch (_) {
    // noop
  }
  return null;
}

export async function readManualLanguageFlag() {
  try {
    return (await AsyncStorage.getItem(APP_LANGUAGE_MANUAL_KEY)) === 'true';
  } catch (_) {
    return false;
  }
}

/**
 * @param {'es'|'en'} language
 * @param {{ manual?: boolean }} [options]
 */
export async function persistAppLanguage(language, options = {}) {
  const safe = getSupportedLanguage(language);
  try {
    await AsyncStorage.setItem(APP_LANGUAGE_STORAGE_KEY, safe);
    if (options.manual === true) {
      await AsyncStorage.setItem(APP_LANGUAGE_MANUAL_KEY, 'true');
    } else if (options.manual === false) {
      await AsyncStorage.removeItem(APP_LANGUAGE_MANUAL_KEY);
    }
  } catch (_) {
    // noop
  }
  setCachedAppLanguage(safe);
  notifyListeners(safe);
  return safe;
}

export function subscribeAppLanguage(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Idioma efectivo al abrir la app o tras auth.
 * @param {object|null|undefined} user
 * @returns {Promise<'es'|'en'>}
 */
export async function resolveAppLanguageForSession(user) {
  const stored = await readStoredAppLanguage();
  const isManual = await readManualLanguageFlag();
  const serverLang = user?.preferences?.language
    ? getSupportedLanguage(user.preferences.language)
    : null;

  if (user && isManual && serverLang) {
    const resolved = await persistAppLanguage(serverLang);
    return resolved;
  }

  if (user && serverLang === 'en') {
    return persistAppLanguage('en');
  }

  if (stored) {
    setCachedAppLanguage(stored);
    return stored;
  }

  const detected = detectDeviceLanguage();
  return persistAppLanguage(detected, { manual: false });
}

/**
 * Tras login / restaurar sesión: alinea storage con la cuenta cuando corresponde.
 * @param {object|null|undefined} user
 */
export async function applyLanguageFromUser(user) {
  return resolveAppLanguageForSession(user);
}

/**
 * Garantiza idioma persistido (p. ej. antes de registro o headers API).
 * @returns {Promise<'es'|'en'>}
 */
export async function ensureAppLanguageInitialized() {
  return resolveAppLanguageForSession(null);
}

export async function getAppLanguage() {
  return ensureAppLanguageInitialized();
}
