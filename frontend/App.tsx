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
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

// Fallback cuando initialWindowMetrics es null (web, SSR, o módulo nativo no listo)
const DEFAULT_SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 0, height: 0 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import Toast from './src/components/Toast';
import ConnectionRestoredListener from './src/components/ConnectionRestoredListener';
import { colors } from './src/styles/globalStyles';

// Constantes de configuración
// 'auto' en iOS adapta el color según el fondo automáticamente, 'light-content' en Android para iconos blancos
const STATUS_BAR_STYLE = Platform.OS === 'ios' ? ('auto' as any) : 'light-content';
const STATUS_BAR_BACKGROUND = 'transparent';
const STATUS_BAR_TRANSLUCENT = true;
const BACKGROUND_COLOR = colors.background;

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
      <ErrorBoundary>
        <AuthProvider>
          <ToastProvider>
            <View style={styles.container}>
              <StatusBar
                barStyle={STATUS_BAR_STYLE}
                backgroundColor={STATUS_BAR_BACKGROUND}
                translucent={STATUS_BAR_TRANSLUCENT}
              />
              <ConnectionRestoredListener />
              <AppNavigator />
              <Toast />
            </View>
          </ToastProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
  },
});
