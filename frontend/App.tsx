/**
 * Componente principal de la aplicación
 *
 * IMPORTANTE: SafeAreaProvider debe ser el wrapper raíz. Toast, FloatingNavBar y
 * muchas pantallas usan useSafeAreaInsets(). Sin este provider se produce:
 * "No safe area value available". Ver docs/SAFE_AREA_REQUIREMENTS.md
 *
 * @author AntoApp Team
 */

import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import {
  ThemePreferenceSync,
  ThemeProvider,
  useTheme,
} from './src/context/ThemeContext';
import { ToastProvider } from './src/context/ToastContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import Toast from './src/components/Toast';
import LanguageAuthSync from './src/components/LanguageAuthSync';
import DeviceRegionSync from './src/components/DeviceRegionSync';
import DeviceTimezoneSync from './src/components/DeviceTimezoneSync';
import AppConfigPreload from './src/components/AppConfigPreload';
import DigitalHealthForegroundSync from './src/components/DigitalHealthForegroundSync';
import NotificationHandler from './src/components/NotificationHandler';

// Fallback cuando initialWindowMetrics es null (web, SSR, o módulo nativo no listo)
const DEFAULT_SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 0, height: 0 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

const STATUS_BAR_BACKGROUND = 'transparent';
const STATUS_BAR_TRANSLUCENT = true;

function AppContent() {
  const { colors, statusBarStyle } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={STATUS_BAR_BACKGROUND}
        translucent={STATUS_BAR_TRANSLUCENT}
      />
      <AppConfigPreload />
      <DigitalHealthForegroundSync />
      <NotificationHandler />
      <AppNavigator />
      <Toast />
    </View>
  );
}

/**
 * Componente principal de la aplicación
 *
 * Envuelve la navegación con el AuthProvider para proporcionar
 * el contexto de autenticación a toda la aplicación.
 *
 * @returns {JSX.Element} Componente principal de la aplicación
 */
export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics ?? DEFAULT_SAFE_AREA_METRICS}>
      <LanguageProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <AuthProvider>
              <LanguageAuthSync />
              <DeviceRegionSync />
              <DeviceTimezoneSync />
              <ThemePreferenceSync />
              <ToastProvider>
                <AppContent />
              </ToastProvider>
            </AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
