/**
 * Componente WebView para mostrar el checkout de Mercado Pago
 * 
 * Permite realizar el pago sin salir de la aplicación.
 * 
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../context/ThemeContext';
import { SPACING } from '../../constants/ui';
import { useSubscriptionTexts } from '../../screens/subscription/subscriptionScreenConstants';

// Verificar que WebView esté disponible
if (!WebView) {
  console.error('WebView no está disponible. Asegúrate de que react-native-webview esté instalado correctamente.');
}

const PaymentWebView = ({ url, onClose, onSuccess, onCancel, onError }) => {
  const TEXTS = useSubscriptionTexts();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef(null);
  const { colors, statusBarStyle } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingVertical: 12,
          backgroundColor: colors.cardBackground,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        closeButton: {
          padding: 8,
        },
        headerTitle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: colors.text,
          flex: 1,
          textAlign: 'center',
        },
        placeholder: {
          width: 40,
        },
        webview: {
          flex: 1,
          backgroundColor: colors.background,
        },
        loadingContainer: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
          zIndex: 1,
        },
        loadingText: {
          marginTop: 16,
          color: colors.textSecondary,
          fontSize: 16,
        },
        errorContainer: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
          padding: 32,
          zIndex: 2,
        },
        errorText: {
          marginTop: 16,
          marginBottom: 24,
          color: colors.error,
          fontSize: 16,
          textAlign: 'center',
        },
        errorButtonsContainer: {
          flexDirection: 'row',
          gap: 12,
          marginTop: 8,
        },
        retryButton: {
          backgroundColor: colors.primary,
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 12,
        },
        errorButton: {
          backgroundColor: colors.primary,
        },
        browserButton: {
          backgroundColor: colors.textSecondary,
        },
        retryButtonText: {
          color: colors.textOnPrimary,
          fontSize: 16,
          fontWeight: 'bold',
        },
        progressBarContainer: {
          height: 3,
          backgroundColor: colors.border,
          width: '100%',
        },
        progressBar: {
          height: '100%',
          backgroundColor: colors.primary,
        },
        secureText: {
          marginTop: 8,
          color: colors.textSecondary,
          fontSize: 12,
          fontStyle: 'italic',
        },
        processingContainer: {
          position: 'absolute',
          top: 60,
          left: 0,
          right: 0,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.cardBackground,
          paddingVertical: 8,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          zIndex: 1,
        },
        processingText: {
          marginLeft: 8,
          color: colors.primary,
          fontSize: 14,
          fontWeight: '600',
        },
        browserFallbackButton: {
          marginTop: 14,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingVertical: 10,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.primary,
        },
        browserFallbackButtonText: {
          color: colors.primary,
          fontSize: 14,
          fontWeight: '600',
        },
      }),
    [colors],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const hasCompletedFlowRef = useRef(false);
  const lastHandledUrlRef = useRef(null);

  // Validar URL antes de cargar
  React.useEffect(() => {
    if (!url) {
      setError(TEXTS.PAYMENT_ERROR_NO_VALID_URL);
      setLoading(false);
      onError?.(TEXTS.PAYMENT_ERROR_NO_VALID_URL);
      return;
    }

    // Validar que la URL sea válida
    try {
      const urlObj = new URL(url);
      if (!urlObj.protocol.startsWith('http')) {
        setError(TEXTS.PAYMENT_ERROR_INVALID_URL_PROTOCOL);
        setLoading(false);
        onError?.(TEXTS.PAYMENT_ERROR_INVALID_URL);
      }
    } catch {
      setError(TEXTS.PAYMENT_ERROR_INVALID_URL);
      setLoading(false);
      onError?.(TEXTS.PAYMENT_ERROR_INVALID_URL);
    }
  }, [url, onError, TEXTS]);

  React.useEffect(() => {
    if (!loading || isProcessing) {
      setLoadTimedOut(false);
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setLoadTimedOut(true);
    }, 12000);

    return () => clearTimeout(timeoutId);
  }, [loading, isProcessing]);

  // Detectar cuando la navegación cambia
  const finishFlowOnce = (callback) => {
    if (hasCompletedFlowRef.current) return false;
    hasCompletedFlowRef.current = true;
    callback?.();
    return true;
  };

  const handleNavigationStateChange = (navState) => {
    const { url: currentUrl } = navState;
    if (!currentUrl || hasCompletedFlowRef.current) return;

    // Evita re-procesar exactamente la misma URL (redirecciones repetidas).
    if (lastHandledUrlRef.current === currentUrl) return;
    lastHandledUrlRef.current = currentUrl;

    // Detectar URLs de éxito/cancelación de Mercado Pago
    // Mercado Pago redirige a URLs específicas después del pago
    if (currentUrl.includes('success') || currentUrl.includes('approved') || 
        currentUrl.includes('collection_status=approved')) {
      setIsProcessing(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Pequeño delay para mostrar feedback visual
      setTimeout(() => {
        finishFlowOnce(onSuccess);
      }, 500);
    } else if (currentUrl.includes('cancel') || currentUrl.includes('cancelled') ||
               currentUrl.includes('collection_status=cancelled')) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      finishFlowOnce(onCancel);
    } else if (currentUrl.includes('pending') || currentUrl.includes('collection_status=pending')) {
      // Pago pendiente
      setIsProcessing(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Info);
    }

    // Detectar errores en la URL
    if (currentUrl.includes('error') || currentUrl.includes('failure')) {
      setError(TEXTS.PAYMENT_ERROR_PROCESS);
      finishFlowOnce(() => onError?.(TEXTS.PAYMENT_ERROR_PROCESS));
    }
  };

  // Manejar errores de carga
  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('Error en WebView:', nativeEvent);
    const description = String(nativeEvent?.description || '').toLowerCase();
    
    // Ignorar errores de "about:srcdoc" que pueden ocurrir con iframes
    if (nativeEvent.url && (nativeEvent.url.includes('about:srcdoc') || nativeEvent.url.includes('about:blank'))) {
      console.warn('Ignorando error de about:srcdoc/about:blank (iframe interno)');
      return;
    }
    
    // Ignorar errores de código -1003 (DNS/red) si la URL es de Mercado Pago
    // Estos errores pueden ser falsos positivos cuando Mercado Pago redirige
    if (nativeEvent.code === -1003 && nativeEvent.url && nativeEvent.url.includes('mercadopago')) {
      console.warn('Ignorando error de DNS para Mercado Pago (puede ser redirección)');
      // No mostrar error inmediatamente, esperar a ver si la página carga
      return;
    }
    
    // Determinar tipo de error
    let errorMessage = TEXTS.PAYMENT_ERROR;
    if (description) {
      if (
        description.includes('network') ||
        description.includes('internet') ||
        description.includes('servidor') ||
        description.includes('server')
      ) {
        errorMessage = TEXTS.PAYMENT_ERROR_CONNECTION;
      } else if (description.includes('timeout') || description.includes('timed out')) {
        errorMessage = TEXTS.PAYMENT_ERROR_TIMEOUT;
      } else if (
        description.includes('no se encontró ningún servidor') ||
        description.includes('could not find server') ||
        description.includes('could not connect to the server')
      ) {
        // Para errores de DNS con Mercado Pago, sugerir usar navegador externo
        errorMessage = TEXTS.PAYMENT_ERROR_MERCADOPAGO_APP;
      }
    }
    
    // Solo mostrar error si no es un error de iframe interno o redirección de Mercado Pago
    if (!nativeEvent.url || (!nativeEvent.url.includes('about:') && !(nativeEvent.code === -1003 && nativeEvent.url.includes('mercadopago')))) {
      setError(errorMessage);
      setLoading(false);
      finishFlowOnce(() => onError?.(errorMessage));
    }
  };

  // Manejar cuando termina de cargar
  const handleLoadEnd = () => {
    setLoading(false);
    setProgress(100);
    setLoadTimedOut(false);
  };

  // Manejar progreso de carga
  const handleLoadProgress = ({ nativeEvent }) => {
    setProgress(nativeEvent.progress * 100);
  };

  // Manejar cuando comienza a cargar
  const handleLoadStart = () => {
    setLoading(true);
    setError(null);
    setLoadTimedOut(false);
  };

  // Reintentar carga
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    webViewRef.current?.reload();
  };

  // Abrir en navegador externo como fallback
  const handleOpenInBrowser = async () => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        onClose?.();
      } else {
        Alert.alert(TEXTS.PAYMENT_ERROR_TITLE, TEXTS.PAYMENT_ERROR_BROWSER_OPEN);
      }
    } catch (error) {
      console.error('Error abriendo URL en navegador:', error);
      Alert.alert(TEXTS.PAYMENT_ERROR_TITLE, TEXTS.PAYMENT_ERROR_BROWSER_OPEN);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle={statusBarStyle} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onClose?.();
          }}
          accessibilityLabel={TEXTS.PAYMENT_CLOSE_A11Y}
        >
          <MaterialCommunityIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{TEXTS.PAYMENT_HEADER_TITLE}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress bar */}
      {loading && progress < 100 && (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
      )}

      {/* Loading indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            {isProcessing ? TEXTS.PAYMENT_LOADING_SECURE : TEXTS.PAYMENT_LOADING}
          </Text>
          {isProcessing && (
            <Text style={styles.secureText}>{TEXTS.PAYMENT_SECURE_LABEL}</Text>
          )}
          {loadTimedOut && !isProcessing && (
            <TouchableOpacity style={styles.browserFallbackButton} onPress={handleOpenInBrowser}>
              <Text style={styles.browserFallbackButtonText}>{TEXTS.PAYMENT_OPEN_BROWSER}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Processing indicator */}
      {isProcessing && !loading && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.processingText}>{TEXTS.PAYMENT_PROCESSING}</Text>
        </View>
      )}

      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <View style={styles.errorButtonsContainer}>
            <TouchableOpacity style={[styles.retryButton, styles.errorButton]} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>{TEXTS.RETRY}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.retryButton, styles.browserButton]} 
              onPress={handleOpenInBrowser}
            >
              <Text style={styles.retryButtonText}>{TEXTS.PAYMENT_OPEN_BROWSER}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* WebView */}
      {url && (
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          style={styles.webview}
          onNavigationStateChange={handleNavigationStateChange}
          onError={handleError}
          onLoadEnd={handleLoadEnd}
          onLoadStart={handleLoadStart}
          onLoadProgress={handleLoadProgress}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('Error HTTP en WebView:', nativeEvent);
            // Solo mostrar error si es un error crítico (4xx, 5xx)
            if (nativeEvent.statusCode >= 400) {
              const errorHttpMessage = TEXTS.PAYMENT_ERROR_HTTP_PAGE.replace(
                '{statusCode}',
                String(nativeEvent.statusCode),
              );
              setError(errorHttpMessage);
              setLoading(false);
              finishFlowOnce(() => onError?.(errorHttpMessage));
            }
          }}
          onShouldStartLoadWithRequest={(request) => {
            // No bloquear redirecciones internas de MP; bloquear solo esquemas peligrosos/no web.
            const requestUrl = request?.url || '';
            if (!requestUrl) return false;
            if (requestUrl.startsWith('javascript:')) return false;
            if (requestUrl.startsWith('file:')) return false;
            return true;
          }}
          startInLoadingState={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          allowsBackForwardNavigationGestures={true}
          // Configuraciones específicas para Android
          androidHardwareAccelerationDisabled={false}
          mixedContentMode="always"
          // Configuraciones específicas para iOS
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          // User agent para mejor compatibilidad
          userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36"
          // Timeout para evitar que se quede cargando indefinidamente
          timeout={30000}
        />
      )}
    </SafeAreaView>
  );
};

export default PaymentWebView;

