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
    // Validar que navigation existe
    if (!navigation) {
      console.error('[NotificationHandler] Navigation is not available');
      return;
    }

    // Listener para notificaciones recibidas mientras la app está en foreground
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      try {
        if (!notification || !notification.request || !notification.request.content) {
          console.warn('[NotificationHandler] Invalid notification structure');
          return;
        }

        console.log('[NotificationHandler] Notification received:', notification);
        
        // Extraer data de forma segura
        const data = notification.request.content.data;
        
        if (data && typeof data === 'object' && data.type === 'scheduled_session') {
          console.log('[NotificationHandler] Scheduled session notification:', data.sessionId);
        }
      } catch (error) {
        console.error('[NotificationHandler] Error in notification received listener:', error);
      }
    });

    // Listener para cuando el usuario toca una notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      try {
        if (!response || !response.notification || !response.notification.request || !response.notification.request.content) {
          console.warn('[NotificationHandler] Invalid response structure');
          return;
        }

        console.log('[NotificationHandler] Notification response received:', response);
        
        const data = response.notification.request.content.data;
        
        // Validar data es un objeto válido
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
          console.warn('[NotificationHandler] Invalid data structure');
          return;
        }
        
        if (data.type === 'scheduled_session' && data.sessionId && typeof data.sessionId === 'string') {
          handleScheduledSessionNotification(data.sessionId, data.timestamp);
        }
      } catch (error) {
        console.error('[NotificationHandler] Error in notification response listener:', error);
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
      // Validar sessionId
      if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
        console.warn('[NotificationHandler] Invalid sessionId:', sessionId);
        return;
      }

      // Validar navigation
      if (!navigation || typeof navigation.navigate !== 'function') {
        console.error('[NotificationHandler] Navigation is not available or invalid');
        return;
      }

      // Calcular latencia de respuesta de forma segura
      let notificationTime = Date.now();
      if (timestamp && typeof timestamp === 'string') {
        try {
          const parsedTime = new Date(timestamp).getTime();
          if (!isNaN(parsedTime) && isFinite(parsedTime)) {
            notificationTime = parsedTime;
          }
        } catch (error) {
          console.warn('[NotificationHandler] Invalid timestamp, using current time:', timestamp);
        }
      }

      const responseTime = Date.now();
      const responseLatency = Math.max(0, responseTime - notificationTime); // Evitar negativos

      // Validar que responseLatency es razonable (menos de 1 hora = 3600000 ms)
      const MAX_LATENCY = 3600000;
      const sanitizedLatency = responseLatency > MAX_LATENCY ? MAX_LATENCY : responseLatency;

      console.log('[NotificationHandler] Navigating to chat for session:', sessionId);
      console.log('[NotificationHandler] Response latency:', sanitizedLatency, 'ms');

      // Validar Platform.OS
      const platform = typeof Platform.OS === 'string' ? Platform.OS : 'unknown';

      // Registrar evento de telemetría (best-effort, no bloquear navegación)
      try {
        await recordSessionStarted(sessionId.trim(), {
          responseLatency: sanitizedLatency,
          platform,
        });
      } catch (telemetryError) {
        console.warn('[NotificationHandler] Telemetry failed (non-blocking):', telemetryError);
      }

      // Navegar al chat con contexto de sesión programada
      navigation.navigate(ROUTES.CHAT, {
        scheduledSessionId: sessionId.trim(),
        source: 'scheduled_session_notification',
        responseLatency: sanitizedLatency,
      });
    } catch (error) {
      console.error('[NotificationHandler] Error handling scheduled session notification:', error);
    }
  };

  // Este componente no renderiza nada
  return null;
}
