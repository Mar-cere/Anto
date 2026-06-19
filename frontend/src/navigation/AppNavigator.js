/**
 * App Navigator
 *
 * Configura el contenedor de navegación principal de la aplicación.
 * Retrasa el stack hasta resolver la sesión para evitar parpadeos de bienvenida.
 */
import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import React, { useEffect } from 'react';
import { Linking } from 'react-native';
import BrandLoadingView from '../components/common/BrandLoadingView';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../context/AuthContext';
import {
  initializeNotifications,
  removeNotificationListeners,
  setupNotificationListeners,
} from '../services/pushNotificationService';
import StackNavigator from './StackNavigator';
import {
  handleActivitySummaryDeepLink,
  handleNotificationData,
  navigationRef,
} from './navigationRef';

const AppNavigator = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    initializeNotifications().catch(() => {});

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

  useEffect(() => {
    const openFromUrl = (url) => {
      if (url) handleActivitySummaryDeepLink(url);
    };

    Linking.getInitialURL()
      .then(openFromUrl)
      .catch(() => {});

    const sub = Linking.addEventListener('url', ({ url }) => openFromUrl(url));
    return () => sub.remove();
  }, []);

  if (loading) {
    return <BrandLoadingView testID="app-auth-bootstrap" />;
  }

  const initialRouteName = user ? ROUTES.MAIN_TABS : ROUTES.HOME;

  return (
    <NavigationContainer ref={navigationRef}>
      <StackNavigator initialRouteName={initialRouteName} />
    </NavigationContainer>
  );
};

export default AppNavigator;
