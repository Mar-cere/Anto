/**
 * Componente principal de la aplicación
 * 
 * Este archivo configura el punto de entrada de la aplicación React Native,
 * envolviendo la navegación con el contexto de autenticación y configurando
 * el StatusBar.
 * 
 * @author AntoApp Team
 */

import React from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
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
    <AuthProvider>
      <View style={styles.container}>
        <StatusBar 
          barStyle={STATUS_BAR_STYLE}
          backgroundColor={STATUS_BAR_BACKGROUND}
          translucent={STATUS_BAR_TRANSLUCENT}
        />
        <AppNavigator />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
  },
});
