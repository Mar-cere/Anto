/**
 * Tema claro / oscuro / sistema. Persistencia local + opcional sincronización con perfil (preferences.theme).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Appearance } from 'react-native';
import { useAuth } from './AuthContext';
import { darkColors, lightColors } from '../styles/themePalettes';
import { createGlobalStyles } from '../styles/globalStyles';

export const THEME_STORAGE_KEY = '@anto/themePreference';

/** Preferencia en cliente: 'system' equivale a 'auto' en API */
export function apiThemeToPreference(apiTheme) {
  if (apiTheme === 'auto') return 'system';
  if (apiTheme === 'dark' || apiTheme === 'light') return apiTheme;
  return null;
}

export function preferenceToApiTheme(pref) {
  if (pref === 'system') return 'auto';
  return pref;
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [preference, setPreferenceState] = useState('system');
  const [hydrated, setHydrated] = useState(false);
  const [systemScheme, setSystemScheme] = useState(() =>
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
  );

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (!cancelled && (raw === 'light' || raw === 'dark' || raw === 'system')) {
          setPreferenceState(raw);
        }
      } catch {
        /* silencioso */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const resolvedScheme = useMemo(() => {
    if (preference === 'system') return systemScheme;
    return preference;
  }, [preference, systemScheme]);

  const colors = resolvedScheme === 'dark' ? darkColors : lightColors;

  const setPreference = useCallback(async (next) => {
    if (next !== 'light' && next !== 'dark' && next !== 'system') return;
    setPreferenceState(next);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* silencioso */
    }
  }, []);

  const globalStyles = useMemo(() => createGlobalStyles(colors), [colors]);

  const statusBarStyle =
    resolvedScheme === 'dark' ? 'light-content' : 'dark-content';

  const value = useMemo(
    () => ({
      preference,
      resolvedScheme,
      colors,
      globalStyles,
      setPreference,
      hydrated,
      statusBarStyle,
    }),
    [
      preference,
      resolvedScheme,
      colors,
      globalStyles,
      setPreference,
      hydrated,
      statusBarStyle,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return ctx;
}

/**
 * Al iniciar sesión, aplica preferences.theme del usuario una sola vez por cuenta.
 */
export function ThemePreferenceSync() {
  const { user } = useAuth();
  const { setPreference, hydrated } = useTheme();
  const appliedForUserRef = useRef(null);

  useEffect(() => {
    if (!hydrated) return;
    const userKey =
      user?._id || user?.id || user?.customId || user?.email || null;
    if (!userKey) {
      appliedForUserRef.current = null;
      return;
    }
    if (appliedForUserRef.current === userKey) return;
    const mapped = apiThemeToPreference(user?.preferences?.theme);
    if (mapped) {
      setPreference(mapped);
    }
    appliedForUserRef.current = userKey;
  }, [hydrated, user, setPreference]);

  return null;
}
