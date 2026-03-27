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
import * as Notifications from 'expo-notifications';
import React, { useEffect } from 'react';
import {
  removeNotificationListeners,
  setupNotificationListeners,
} from '../services/pushNotificationService';
import StackNavigator from './StackNavigator';
import { handleNotificationData, navigationRef } from './navigationRef';

/**
 * Componente App Navigator
 * 
 * Envuelve el StackNavigator en un NavigationContainer para
 * proporcionar el contexto de navegación a toda la aplicación.
 * 
 * @returns {JSX.Element} NavigationContainer con StackNavigator
 */
const AppNavigator = () => {
  useEffect(() => {
    const subs = setupNotificationListeners(undefined, (response) => {
      const data = response?.notification?.request?.content?.data;
      handleNotificationData(data);
    });

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        const data = response?.notification?.request?.content?.data;
        if (data) handleNotificationData(data);
      })
      .catch(() => {});

    return () => removeNotificationListeners(subs);
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <StackNavigator />
    </NavigationContainer>
  );
};

export default AppNavigator;
