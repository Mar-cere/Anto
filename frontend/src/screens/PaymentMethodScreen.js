/**
 * Pantalla de Métodos de Pago
 * 
 * Muestra información sobre el método de pago actual y permite actualizarlo.
 * 
 * @author AntoApp Team
 */

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';
import FloatingNavBar from '../components/FloatingNavBar';
import paymentService from '../services/paymentService';
import { useTheme } from '../context/ThemeContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import { SPACING } from '../constants/ui';

// Constantes
const DEFAULT_TEXTS = {
  TITLE: 'Método de Pago',
  CURRENT_METHOD: 'Método de Pago Actual',
  UPDATE_METHOD: 'Actualizar Método de Pago',
  LOADING: 'Cargando información...',
  ERROR: 'Error al cargar la información',
  RETRY: 'Reintentar',
  NO_METHOD: 'No hay método de pago configurado',
  NO_METHOD_DESC: 'Configura un método de pago para suscribirte',
  UPDATE_SUCCESS: 'Método de pago actualizado exitosamente',
  UPDATE_ERROR: 'Error al actualizar el método de pago',
  UPDATE_CONFIRM: '¿Deseas actualizar tu método de pago?',
  MERCADOPAGO_INFO: 'Los métodos de pago se gestionan a través de Mercado Pago',
  MERCADOPAGO_DESC: 'Al suscribirte o actualizar tu suscripción, podrás elegir tu método de pago preferido.',
  SUPPORTED_METHODS: 'Métodos de Pago Soportados',
  CARD: 'Tarjeta de Crédito/Débito',
  BANK_TRANSFER: 'Transferencia Bancaria',
  OTHER: 'Otros métodos',
  CANCEL: 'Cancelar',
  UPDATE: 'Actualizar',
  REDIRECT_TITLE: 'Actualizar Método de Pago',
  REDIRECT_MESSAGE:
    'Serás redirigido a la pantalla de suscripción donde podrás actualizar tu método de pago.',
  COMMON_OK: 'OK',
  UPDATE_ERROR_FALLBACK:
    'Ocurrió un error al intentar actualizar el método de pago',
  VIEW_PLANS: 'Ver Planes',
  DEFAULT_METHOD: 'Mercado Pago',
  CARD_DESCRIPTION: 'Visa, Mastercard, Amex',
  BANK_TRANSFER_DESCRIPTION: 'Transferencia bancaria',
  OTHER_DESCRIPTION: 'Mercado Pago, otros',
  ERROR_CONNECTION: 'Error de conexión. Verifica internet e inténtalo de nuevo.',
  ERROR_TOO_MANY_REQUESTS: 'Demasiados intentos. Espera un momento e inténtalo nuevamente.',
};

const resolvePaymentMethodErrorMessage = (error, texts, fallbackKey = 'ERROR') => {
  const normalizedMessage = String(
    error?.response?.data?.message ?? error?.message ?? '',
  ).toLowerCase();
  const status = error?.response?.status;

  const isNetwork =
    normalizedMessage.includes('network') ||
    normalizedMessage.includes('econnrefused') ||
    normalizedMessage.includes('timeout') ||
    normalizedMessage.includes('timed out') ||
    normalizedMessage.includes('failed to fetch');

  if (isNetwork) {
    return texts.ERROR_CONNECTION || texts[fallbackKey] || texts.ERROR;
  }

  const isTooManyRequests =
    status === 429 ||
    normalizedMessage.includes('too many') ||
    normalizedMessage.includes('demasiados intentos');

  if (isTooManyRequests) {
    return texts.ERROR_TOO_MANY_REQUESTS || texts[fallbackKey] || texts.ERROR;
  }

  return texts[fallbackKey] || texts.ERROR;
};

const resolvePaymentMethodResultErrorMessage = (result, texts, fallbackKey = 'ERROR') => {
  const code = String(result?.errorCode || '').toUpperCase();
  if (code === 'NETWORK_ERROR' || code === 'TIMEOUT') {
    return texts.ERROR_CONNECTION || texts[fallbackKey] || texts.ERROR;
  }
  if (code === 'RATE_LIMIT') {
    return texts.ERROR_TOO_MANY_REQUESTS || texts[fallbackKey] || texts.ERROR;
  }
  return texts[fallbackKey] || texts.ERROR;
};

const PaymentMethodScreen = () => {
  const translated = useSectionTranslations('PROFILE');
  const TEXTS = useMemo(
    () => ({
      ...DEFAULT_TEXTS,
      TITLE: translated?.PAYMENT_METHOD_TITLE || DEFAULT_TEXTS.TITLE,
      CURRENT_METHOD:
        translated?.PAYMENT_METHOD_CURRENT_METHOD || DEFAULT_TEXTS.CURRENT_METHOD,
      UPDATE_METHOD:
        translated?.PAYMENT_METHOD_UPDATE_METHOD || DEFAULT_TEXTS.UPDATE_METHOD,
      LOADING: translated?.PAYMENT_METHOD_LOADING || DEFAULT_TEXTS.LOADING,
      ERROR: translated?.PAYMENT_METHOD_ERROR || DEFAULT_TEXTS.ERROR,
      RETRY: translated?.RETRY || DEFAULT_TEXTS.RETRY,
      NO_METHOD:
        translated?.PAYMENT_METHOD_NO_METHOD || DEFAULT_TEXTS.NO_METHOD,
      NO_METHOD_DESC:
        translated?.PAYMENT_METHOD_NO_METHOD_DESC || DEFAULT_TEXTS.NO_METHOD_DESC,
      UPDATE_ERROR:
        translated?.PAYMENT_METHOD_UPDATE_ERROR || DEFAULT_TEXTS.UPDATE_ERROR,
      UPDATE_CONFIRM:
        translated?.PAYMENT_METHOD_UPDATE_CONFIRM || DEFAULT_TEXTS.UPDATE_CONFIRM,
      MERCADOPAGO_INFO:
        translated?.PAYMENT_METHOD_PROVIDER_INFO || DEFAULT_TEXTS.MERCADOPAGO_INFO,
      MERCADOPAGO_DESC:
        translated?.PAYMENT_METHOD_PROVIDER_DESC || DEFAULT_TEXTS.MERCADOPAGO_DESC,
      SUPPORTED_METHODS:
        translated?.PAYMENT_METHOD_SUPPORTED_METHODS ||
        DEFAULT_TEXTS.SUPPORTED_METHODS,
      CARD: translated?.PAYMENT_METHOD_CARD || DEFAULT_TEXTS.CARD,
      BANK_TRANSFER:
        translated?.PAYMENT_METHOD_BANK_TRANSFER || DEFAULT_TEXTS.BANK_TRANSFER,
      OTHER: translated?.PAYMENT_METHOD_OTHER || DEFAULT_TEXTS.OTHER,
      CANCEL: translated?.CANCEL || DEFAULT_TEXTS.CANCEL,
      UPDATE: translated?.PAYMENT_METHOD_UPDATE_ACTION || DEFAULT_TEXTS.UPDATE,
      REDIRECT_TITLE:
        translated?.PAYMENT_METHOD_REDIRECT_TITLE || DEFAULT_TEXTS.REDIRECT_TITLE,
      REDIRECT_MESSAGE:
        translated?.PAYMENT_METHOD_REDIRECT_MESSAGE ||
        DEFAULT_TEXTS.REDIRECT_MESSAGE,
      COMMON_OK: translated?.COMMON_OK || DEFAULT_TEXTS.COMMON_OK,
      UPDATE_ERROR_FALLBACK:
        translated?.PAYMENT_METHOD_UPDATE_ERROR_FALLBACK ||
        DEFAULT_TEXTS.UPDATE_ERROR_FALLBACK,
      VIEW_PLANS:
        translated?.PAYMENT_METHOD_VIEW_PLANS || DEFAULT_TEXTS.VIEW_PLANS,
      DEFAULT_METHOD:
        translated?.PAYMENT_METHOD_DEFAULT_METHOD || DEFAULT_TEXTS.DEFAULT_METHOD,
      CARD_DESCRIPTION:
        translated?.PAYMENT_METHOD_CARD_DESC || DEFAULT_TEXTS.CARD_DESCRIPTION,
      BANK_TRANSFER_DESCRIPTION:
        translated?.PAYMENT_METHOD_BANK_TRANSFER_DESC ||
        DEFAULT_TEXTS.BANK_TRANSFER_DESCRIPTION,
      OTHER_DESCRIPTION:
        translated?.PAYMENT_METHOD_OTHER_DESC || DEFAULT_TEXTS.OTHER_DESCRIPTION,
      ERROR_CONNECTION:
        translated?.ERROR_CONNECTION || DEFAULT_TEXTS.ERROR_CONNECTION,
      ERROR_TOO_MANY_REQUESTS:
        translated?.ERROR_TOO_MANY_REQUESTS ||
        DEFAULT_TEXTS.ERROR_TOO_MANY_REQUESTS,
    }),
    [translated],
  );
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        centerContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 32,
        },
        loadingText: {
          marginTop: 16,
          color: colors.textSecondary,
          fontSize: 16,
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
          color: colors.textOnPrimary,
          fontSize: 16,
          fontWeight: 'bold',
        },
        scrollView: {
          flex: 1,
        },
        scrollContent: {
          padding: SPACING.SCREEN_EDGE_INSET,
        },
        infoCard: {
          backgroundColor: colors.cardBackground,
          borderRadius: 12,
          padding: 24,
          marginBottom: 16,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: colors.border,
        },
        infoTitle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: colors.text,
          marginTop: 16,
          marginBottom: 8,
          textAlign: 'center',
        },
        infoText: {
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 16,
        },
        primaryButton: {
          backgroundColor: colors.primary,
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 12,
          marginTop: 8,
        },
        primaryButtonText: {
          color: colors.textOnPrimary,
          fontSize: 16,
          fontWeight: 'bold',
        },
        secondaryButton: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: `${colors.primary}20`,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingVertical: 10,
          borderRadius: 12,
          marginTop: 8,
        },
        secondaryButtonText: {
          color: colors.primary,
          fontSize: 14,
          fontWeight: '600',
          marginLeft: 8,
        },
        section: {
          marginTop: 8,
        },
        sectionTitle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: colors.text,
          marginBottom: 16,
        },
        methodCard: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.cardBackground,
          borderRadius: 12,
          padding: SPACING.SCREEN_EDGE_INSET,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: colors.border,
        },
        methodInfo: {
          flex: 1,
          marginLeft: 16,
        },
        methodName: {
          fontSize: 16,
          fontWeight: '600',
          color: colors.text,
          marginBottom: 4,
        },
        methodDescription: {
          fontSize: 14,
          color: colors.textSecondary,
        },
      }),
    [colors],
  );
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  // Cargar información de suscripción
  const loadSubscriptionStatus = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const response = await paymentService.getSubscriptionStatus();
      if (response.success) {
        setSubscriptionStatus(response);
      } else {
        setError(resolvePaymentMethodResultErrorMessage(response, TEXTS, 'ERROR'));
      }
    } catch (err) {
      console.error('Error cargando estado de suscripción:', err);
      setError(resolvePaymentMethodErrorMessage(err, TEXTS, 'ERROR'));
    } finally {
      setLoading(false);
    }
  }, [TEXTS]);

  // Cargar al montar
  useEffect(() => {
    loadSubscriptionStatus();
  }, [loadSubscriptionStatus]);

  // Recargar cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      loadSubscriptionStatus();
    }, [loadSubscriptionStatus])
  );

  // Manejar actualización de método de pago
  const handleUpdatePaymentMethod = useCallback(async () => {
    Alert.alert(
      TEXTS.UPDATE_METHOD,
      TEXTS.UPDATE_CONFIRM + '\n\n' + TEXTS.MERCADOPAGO_DESC,
      [
        {
          text: TEXTS.CANCEL,
          style: 'cancel',
        },
        {
          text: TEXTS.UPDATE,
          onPress: async () => {
            try {
              setUpdating(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

              // Navegar a la pantalla de suscripción para actualizar el método de pago
              navigation.navigate('Subscription');
              
              Alert.alert(
                TEXTS.REDIRECT_TITLE,
                TEXTS.REDIRECT_MESSAGE,
                [{ text: TEXTS.COMMON_OK }]
              );
            } catch (err) {
              console.error('Error actualizando método de pago:', err);
              Alert.alert(
                TEXTS.UPDATE_ERROR,
                resolvePaymentMethodErrorMessage(
                  err,
                  TEXTS,
                  'UPDATE_ERROR_FALLBACK',
                ),
              );
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  }, [navigation, TEXTS]);

  // Renderizar método de pago actual
  const renderCurrentMethod = () => {
    if (!subscriptionStatus || !subscriptionStatus.hasActiveSubscription) {
      return (
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="credit-card-off" size={48} color={colors.textSecondary} />
          <Text style={styles.infoTitle}>{TEXTS.NO_METHOD}</Text>
          <Text style={styles.infoText}>{TEXTS.NO_METHOD_DESC}</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Subscription')}
          >
            <Text style={styles.primaryButtonText}>{TEXTS.VIEW_PLANS}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.infoCard}>
        <MaterialCommunityIcons name="credit-card" size={48} color={colors.primary} />
        <Text style={styles.infoTitle}>{TEXTS.CURRENT_METHOD}</Text>
        <Text style={styles.infoText}>
          {subscriptionStatus.paymentMethod || TEXTS.DEFAULT_METHOD}
        </Text>
        {subscriptionStatus.hasActiveSubscription && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleUpdatePaymentMethod}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <MaterialCommunityIcons name="pencil" size={20} color={colors.primary} />
                <Text style={styles.secondaryButtonText}>{TEXTS.UPDATE_METHOD}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Renderizar métodos soportados
  const renderSupportedMethods = () => {
    const methods = [
      {
        icon: 'credit-card',
        name: TEXTS.CARD,
        description: TEXTS.CARD_DESCRIPTION,
      },
      {
        icon: 'bank',
        name: TEXTS.BANK_TRANSFER,
        description: TEXTS.BANK_TRANSFER_DESCRIPTION,
      },
      {
        icon: 'wallet',
        name: TEXTS.OTHER,
        description: TEXTS.OTHER_DESCRIPTION,
      },
    ];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{TEXTS.SUPPORTED_METHODS}</Text>
        {methods.map((method, index) => (
          <View key={index} style={styles.methodCard}>
            <MaterialCommunityIcons name={method.icon} size={32} color={colors.primary} />
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>{method.name}</Text>
              <Text style={styles.methodDescription}>{method.description}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // Renderizar contenido
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{TEXTS.LOADING}</Text>
        </View>
      );
    }

    if (error && !subscriptionStatus) {
      return (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadSubscriptionStatus}>
            <Text style={styles.retryButtonText}>{TEXTS.RETRY}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + SPACING.FLOATING_NAV_SCROLL_BOTTOM_EXTRA },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {renderCurrentMethod()}
        
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="information" size={32} color={colors.primary} />
          <Text style={styles.infoTitle}>{TEXTS.MERCADOPAGO_INFO}</Text>
          <Text style={styles.infoText}>{TEXTS.MERCADOPAGO_DESC}</Text>
        </View>

        {renderSupportedMethods()}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle={statusBarStyle} />
      <Header
        greeting=""
        userName=""
        showBackButton={true}
        title={TEXTS.TITLE}
      />
      {renderContent()}
      <FloatingNavBar />
    </SafeAreaView>
  );
};

export default PaymentMethodScreen;

