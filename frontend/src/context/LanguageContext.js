import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, getSupportedLanguage } from '../constants/translations';

const STORAGE_KEY = 'preferences:language';

const LanguageContext = createContext(null);
const FALLBACK_LANGUAGE_CONTEXT = {
  language: DEFAULT_LANGUAGE,
  setLanguage: async () => DEFAULT_LANGUAGE,
  availableLanguages: SUPPORTED_LANGUAGES,
};

function detectDeviceLanguage() {
  try {
    const locale = Intl?.DateTimeFormat?.().resolvedOptions?.().locale;
    if (typeof locale === 'string' && locale.toLowerCase().startsWith('en')) {
      return 'en';
    }
  } catch (_) {
    // noop
  }
  return DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;
        if (stored) {
          setLanguage(getSupportedLanguage(stored));
          return;
        }
        setLanguage(getSupportedLanguage(detectDeviceLanguage()));
      } catch (_) {
        if (!cancelled) {
          setLanguage(DEFAULT_LANGUAGE);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguagePreference = useCallback(async (nextLanguage) => {
    const safeLanguage = getSupportedLanguage(nextLanguage);
    setLanguage(safeLanguage);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, safeLanguage);
    } catch (_) {
      // noop
    }
    return safeLanguage;
  }, []);

  const value = useMemo(
    () => ({
      language,
      setLanguage: setLanguagePreference,
      availableLanguages: SUPPORTED_LANGUAGES,
    }),
    [language, setLanguagePreference],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  return context || FALLBACK_LANGUAGE_CONTEXT;
}
