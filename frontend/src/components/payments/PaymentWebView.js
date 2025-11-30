/**
 * Componente WebView para mostrar el checkout de Mercado Pago
 * 
 * Permite realizar el pago sin salir de la aplicación.
 * 
 * @author AntoApp Team
 */

import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../styles/globalStyles';
import * as Haptics from 'expo-haptics';

// Constantes
const TEXTS = {
  CLOSE: 'Cerrar',
  LOADING: 'Cargando...',
  ERROR: 'Error al cargar el pago',
  RETRY: 'Reintentar',
};

const PaymentWebView = ({ url, onClose, onSuccess, onCancel, onError }) => {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Detectar cuando la navegación cambia
  const handleNavigationStateChange = (navState) => {
    const { url: currentUrl } = navState;

    // Detectar URLs de éxito/cancelación de Mercado Pago
    // Mercado Pago redirige a URLs específicas después del pago
    if (currentUrl.includes('success') || currentUrl.includes('approved')) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess?.();
    } else if (currentUrl.includes('cancel') || currentUrl.includes('cancelled')) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onCancel?.();
    } else if (currentUrl.includes('pending')) {
      // Pago pendiente
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
    setError(nativeEvent.description || TEXTS.ERROR);
    setLoading(false);
    onError?.(nativeEvent.description || TEXTS.ERROR);
  };

  // Manejar cuando termina de cargar
  const handleLoadEnd = () => {
    setLoading(false);
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

      {/* Loading indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{TEXTS.LOADING}</Text>
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
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        allowsBackForwardNavigationGestures={true}
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
});

export default PaymentWebView;

