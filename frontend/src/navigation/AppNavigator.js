/**
 * App Navigator
 * 
 * Configura el contenedor de navegación principal de la aplicación.
 * Utiliza StackNavigator como navegador principal que contiene
 * todas las pantallas, incluyendo TabNavigator para las pantallas principales.
 * 
 * @author AntoApp Team
 */

import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import StackNavigator from './StackNavigator';

/**
 * Componente App Navigator
 * 
 * Envuelve el StackNavigator en un NavigationContainer para
 * proporcionar el contexto de navegación a toda la aplicación.
 * 
 * @returns {JSX.Element} NavigationContainer con StackNavigator
 */
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <StackNavigator />
    </NavigationContainer>
  );
};

export default AppNavigator;
