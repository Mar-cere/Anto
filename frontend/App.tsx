/**
 * Componente principal de la aplicación
 * 
 * Este archivo configura el punto de entrada de la aplicación React Native,
 * envolviendo la navegación con el contexto de autenticación y configurando
 * el StatusBar.
 * 
 * @author AntoApp Team
 */

import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/styles/globalStyles';

// Constantes de configuración
const STATUS_BAR_STYLE = 'light';
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
        <StatusBar style={STATUS_BAR_STYLE} />
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
