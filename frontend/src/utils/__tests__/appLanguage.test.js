import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  APP_LANGUAGE_MANUAL_KEY,
  APP_LANGUAGE_STORAGE_KEY,
  applyLanguageFromUser,
  detectDeviceLanguage,
  getDeviceLocaleCandidates,
  persistAppLanguage,
  readStoredAppLanguage,
  resolveAppLanguageForSession,
} from '../appLanguage';

describe('appLanguage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.restoreAllMocks();
  });

  const mockDeviceLocales = (locales) => {
    jest.spyOn(Intl, 'DateTimeFormat').mockReturnValue({
      resolvedOptions: () => ({ locale: locales[0] || 'es' }),
    });
    Object.defineProperty(global, 'navigator', {
      value: { language: locales[0], languages: locales },
      configurable: true,
    });
  };

  describe('detectDeviceLanguage', () => {
    it('devuelve en cuando el locale del dispositivo es inglés', () => {
      mockDeviceLocales(['en-US']);
      expect(detectDeviceLanguage()).toBe('en');
    });

    it('devuelve es para locales españoles', () => {
      mockDeviceLocales(['es-CL']);
      expect(detectDeviceLanguage()).toBe('es');
    });

    it('devuelve en para portugués, japonés u otros no españoles', () => {
      mockDeviceLocales(['pt-BR']);
      expect(detectDeviceLanguage()).toBe('en');
      mockDeviceLocales(['ja-JP']);
      expect(detectDeviceLanguage()).toBe('en');
      mockDeviceLocales(['ru-RU']);
      expect(detectDeviceLanguage()).toBe('en');
    });

    it('devuelve en si no hay locale utilizable', () => {
      jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
        throw new Error('no intl');
      });
      Object.defineProperty(global, 'navigator', {
        value: { language: undefined, languages: [] },
        configurable: true,
      });
      expect(detectDeviceLanguage()).toBe('en');
    });
  });

  describe('resolveAppLanguageForSession', () => {
    it('detecta y persiste en primer arranque', async () => {
      mockDeviceLocales(['en-GB']);
      const lang = await resolveAppLanguageForSession(null);
      expect(lang).toBe('en');
      expect(await AsyncStorage.getItem(APP_LANGUAGE_STORAGE_KEY)).toBe('en');
    });

    it('usa preferencia guardada sin redetectar', async () => {
      await AsyncStorage.setItem(APP_LANGUAGE_STORAGE_KEY, 'es');
      mockDeviceLocales(['en-US']);
      const lang = await resolveAppLanguageForSession(null);
      expect(lang).toBe('es');
    });

    it('respeta servidor en inglés tras login aunque el perfil legacy sea es', async () => {
      await AsyncStorage.setItem(APP_LANGUAGE_STORAGE_KEY, 'es');
      const lang = await resolveAppLanguageForSession({
        preferences: { language: 'en' },
      });
      expect(lang).toBe('en');
    });

    it('mantiene dispositivo en español si el servidor solo tiene es por defecto', async () => {
      mockDeviceLocales(['en-US']);
      await persistAppLanguage('en', { manual: false });
      const lang = await resolveAppLanguageForSession({
        preferences: { language: 'es' },
      });
      expect(lang).toBe('en');
    });

    it('aplica idioma del servidor si el usuario lo eligió manualmente', async () => {
      await persistAppLanguage('en', { manual: true });
      const lang = await resolveAppLanguageForSession({
        preferences: { language: 'es' },
      });
      expect(lang).toBe('es');
    });
  });

  describe('applyLanguageFromUser', () => {
    it('notifica a suscriptores', async () => {
      const listener = jest.fn();
      const { subscribeAppLanguage } = require('../appLanguage');
      subscribeAppLanguage(listener);
      await applyLanguageFromUser({ preferences: { language: 'en' } });
      expect(listener).toHaveBeenCalledWith('en');
    });
  });

  describe('getDeviceLocaleCandidates', () => {
    it('incluye locale de Intl cuando está disponible', () => {
      const locales = getDeviceLocaleCandidates();
      expect(Array.isArray(locales)).toBe(true);
    });

    it('devuelve es con un único locale hispanohablante', () => {
      mockDeviceLocales(['es-MX']);
      expect(detectDeviceLanguage()).toBe('es');
    });
  });

  describe('readStoredAppLanguage', () => {
    it('ignora valores no soportados en storage', async () => {
      await AsyncStorage.setItem(APP_LANGUAGE_STORAGE_KEY, 'fr');
      expect(await readStoredAppLanguage()).toBeNull();
    });
  });

  describe('persistAppLanguage', () => {
    it('marca preferencia manual cuando el usuario elige en ajustes', async () => {
      await persistAppLanguage('en', { manual: true });
      expect(await AsyncStorage.getItem(APP_LANGUAGE_MANUAL_KEY)).toBe('true');
    });
  });
});
