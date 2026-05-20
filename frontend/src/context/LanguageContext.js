import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SUPPORTED_LANGUAGES, getSupportedLanguage } from '../constants/translations';
import {
  detectDeviceLanguage,
  persistAppLanguage,
  resolveAppLanguageForSession,
  subscribeAppLanguage,
} from '../utils/appLanguage';

const LanguageContext = createContext(null);
const FALLBACK_LANGUAGE_CONTEXT = {
  language: detectDeviceLanguage(),
  isLanguageReady: false,
  setLanguage: async () => detectDeviceLanguage(),
  availableLanguages: SUPPORTED_LANGUAGES,
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => detectDeviceLanguage());
  const [isLanguageReady, setIsLanguageReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resolved = await resolveAppLanguageForSession(null);
        if (!cancelled) {
          setLanguage(getSupportedLanguage(resolved));
        }
      } catch (_) {
        if (!cancelled) {
          setLanguage(detectDeviceLanguage());
        }
      } finally {
        if (!cancelled) {
          setIsLanguageReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return subscribeAppLanguage((nextLanguage) => {
      setLanguage(getSupportedLanguage(nextLanguage));
    });
  }, []);

  const setLanguagePreference = useCallback(async (nextLanguage) => {
    const safeLanguage = getSupportedLanguage(nextLanguage);
    setLanguage(safeLanguage);
    await persistAppLanguage(safeLanguage, { manual: true });
    return safeLanguage;
  }, []);

  const value = useMemo(
    () => ({
      language,
      isLanguageReady,
      setLanguage: setLanguagePreference,
      availableLanguages: SUPPORTED_LANGUAGES,
    }),
    [language, isLanguageReady, setLanguagePreference],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  return context || FALLBACK_LANGUAGE_CONTEXT;
}
