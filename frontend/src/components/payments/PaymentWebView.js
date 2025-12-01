/**
 * Componente WebView para mostrar el checkout de Mercado Pago
 * 
 * Permite realizar el pago sin salir de la aplicación.
 * 
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { colors } from '../../styles/globalStyles';

// Verificar que WebView esté disponible
if (!WebView) {
  console.error('WebView no está disponible. Asegúrate de que react-native-webview esté instalado correctamente.');
}

// Constantes
const TEXTS = {
  CLOSE: 'Cerrar',
  LOADING: 'Cargando página de pago...',
  LOADING_PAYMENT: 'Procesando tu pago de forma segura...',
  ERROR: 'Error al cargar el pago',
  RETRY: 'Reintentar',
  SECURE_PAYMENT: 'Pago seguro con Mercado Pago',
  PROCESSING: 'Procesando...',
};

const PaymentWebView = ({ url, onClose, onSuccess, onCancel, onError }) => {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Detectar cuando la navegación cambia
  const handleNavigationStateChange = (navState) => {
    const { url: currentUrl } = navState;

    // Detectar URLs de éxito/cancelación de Mercado Pago
    // Mercado Pago redirige a URLs específicas después del pago
    if (currentUrl.includes('success') || currentUrl.includes('approved') || 
        currentUrl.includes('collection_status=approved')) {
      setIsProcessing(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Pequeño delay para mostrar feedback visual
      setTimeout(() => {
        onSuccess?.();
      }, 500);
    } else if (currentUrl.includes('cancel') || currentUrl.includes('cancelled') ||
               currentUrl.includes('collection_status=cancelled')) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onCancel?.();
    } else if (currentUrl.includes('pending') || currentUrl.includes('collection_status=pending')) {
      // Pago pendiente
      setIsProcessing(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Info);
    }

    // Detectar errores en la URL
    if (currentUrl.includes('error') || currentUrl.includes('failure')) {
      setError('Error en el proceso de pago');
      onError?.('Error en el proceso de pago');
    }
  };

  // Manejar errores de carga
  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('Error en WebView:', nativeEvent);
    
    // Determinar tipo de error
    let errorMessage = TEXTS.ERROR;
    if (nativeEvent.description) {
      if (nativeEvent.description.includes('network') || nativeEvent.description.includes('internet')) {
        errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
      } else if (nativeEvent.description.includes('timeout')) {
        errorMessage = 'Tiempo de espera agotado. Por favor, intenta nuevamente.';
      } else {
        errorMessage = nativeEvent.description;
      }
    }
    
    setError(errorMessage);
    setLoading(false);
    onError?.(errorMessage);
  };

  // Manejar cuando termina de cargar
  const handleLoadEnd = () => {
    setLoading(false);
    setProgress(100);
  };

  // Manejar progreso de carga
  const handleLoadProgress = ({ nativeEvent }) => {
    setProgress(nativeEvent.progress * 100);
  };

  // Manejar cuando comienza a cargar
  const handleLoadStart = () => {
    setLoading(true);
    setError(null);
  };

  // Reintentar carga
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    webViewRef.current?.reload();
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onClose?.();
          }}
          accessibilityLabel={TEXTS.CLOSE}
        >
          <MaterialCommunityIcons name="close" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pago con Mercado Pago</Text>
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
            {isProcessing ? TEXTS.LOADING_PAYMENT : TEXTS.LOADING}
          </Text>
          {isProcessing && (
            <Text style={styles.secureText}>{TEXTS.SECURE_PAYMENT}</Text>
          )}
        </View>
      )}

      {/* Processing indicator */}
      {isProcessing && !loading && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.processingText}>{TEXTS.PROCESSING}</Text>
        </View>
      )}

      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>{TEXTS.RETRY}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onError={handleError}
        onLoadEnd={handleLoadEnd}
        onLoadStart={handleLoadStart}
        onLoadProgress={handleLoadProgress}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        allowsBackForwardNavigationGestures={true}
        // Configuraciones específicas para Android
        androidHardwareAccelerationDisabled={false}
        mixedContentMode="always"
        // User agent para mejor compatibilidad
        userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
    color: colors.white,
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
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: colors.white,
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
    paddingHorizontal: 16,
    zIndex: 1,
  },
  processingText: {
    marginLeft: 8,
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PaymentWebView;

