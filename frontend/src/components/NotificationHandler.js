/**
 * Componente para manejar notificaciones entrantes y deep linking (#15).
 * Escucha notificaciones de sesiones programadas y navega al chat.
 */
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { ROUTES } from '../constants/routes';
import { recordSessionStarted } from '../services/sessionTelemetryService';

/**
 * Hook para manejar notificaciones de sesiones programadas.
 * Registra listeners y navega al chat cuando se toca una notificación.
 */
export default function NotificationHandler() {
  const navigation = useNavigation();
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Listener para notificaciones recibidas mientras la app está en foreground
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[NotificationHandler] Notification received:', notification);
      
      // Extraer data
      const data = notification.request.content.data;
      
      if (data && data.type === 'scheduled_session') {
        console.log('[NotificationHandler] Scheduled session notification:', data.sessionId);
      }
    });

    // Listener para cuando el usuario toca una notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('[NotificationHandler] Notification response received:', response);
      
      const data = response.notification.request.content.data;
      
      if (data && data.type === 'scheduled_session' && data.sessionId) {
        handleScheduledSessionNotification(data.sessionId, data.timestamp);
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [navigation]);

  /**
   * Maneja una notificación de sesión programada.
   * Navega al chat y registra telemetría.
   * @param {string} sessionId - ID de la sesión
   * @param {string} timestamp - Timestamp de la notificación
   */
  const handleScheduledSessionNotification = async (sessionId, timestamp) => {
    try {
      // Calcular latencia de respuesta
      const notificationTime = timestamp ? new Date(timestamp).getTime() : Date.now();
      const responseTime = Date.now();
      const responseLatency = responseTime - notificationTime;

      console.log('[NotificationHandler] Navigating to chat for session:', sessionId);
      console.log('[NotificationHandler] Response latency:', responseLatency, 'ms');

      // Registrar evento de telemetría
      await recordSessionStarted(sessionId, {
        responseLatency,
        platform: Platform.OS,
      });

      // Navegar al chat con contexto de sesión programada
      navigation.navigate(ROUTES.CHAT, {
        scheduledSessionId: sessionId,
        source: 'scheduled_session_notification',
        responseLatency,
      });
    } catch (error) {
      console.error('[NotificationHandler] Error handling scheduled session notification:', error);
    }
  };

  // Este componente no renderiza nada
  return null;
}
