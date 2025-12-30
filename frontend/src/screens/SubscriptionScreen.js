/**
 * Pantalla de Suscripción
 * 
 * Muestra los planes disponibles y permite al usuario suscribirse.
 * Incluye integración con Mercado Pago para procesar pagos.
 * 
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FloatingNavBar from '../components/FloatingNavBar';
import Header from '../components/Header';
import PaymentWebView from '../components/payments/PaymentWebView';
import PlanCard from '../components/payments/PlanCard';
import SubscriptionStatus from '../components/payments/SubscriptionStatus';
import paymentService from '../services/paymentService';
import storeKitService from '../services/storeKitService';
import { colors } from '../styles/globalStyles';

// Constantes de textos
const TEXTS = {
  TITLE: 'Suscripción Premium',
  SUBTITLE: 'Todos los planes incluyen el servicio completo. Elige la duración que prefieras.',
  CURRENT_SUBSCRIPTION: 'Tu Suscripción',
  AVAILABLE_PLANS: 'Planes Disponibles',
  LOADING: 'Cargando planes...',
  ERROR: 'Error al cargar los planes',
  RETRY: 'Reintentar',
  SUBSCRIBING: 'Procesando...',
  SUBSCRIBE_ERROR: 'Error al procesar la suscripción',
  OPENING_PAYMENT: 'Abriendo página de pago...',
  CANCEL_SUBSCRIPTION: 'Cancelar Suscripción',
  CANCEL_CONFIRM: '¿Estás seguro de que deseas cancelar tu suscripción?',
  CANCEL_SUCCESS: 'Suscripción cancelada exitosamente',
  CANCEL_ERROR: 'Error al cancelar la suscripción',
  NO_PLANS: 'No hay planes disponibles en este momento',
};

const SubscriptionScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [plans, setPlans] = useState([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [error, setError] = useState(null);
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);

  // TEMPORAL: Planes hardcodeados para screenshots
  // TODO: Conectar con backend/StoreKit en próxima versión
  const HARDCODED_PLANS = [
    {
      id: 'weekly',
      name: 'Premium Semanal',
      amount: 990,
      formattedAmount: '$990',
      interval: 'week',
      currency: 'CLP',
      features: ['Servicio completo incluido'],
    },
    {
      id: 'monthly',
      name: 'Premium Mensual',
      amount: 3990,
      formattedAmount: '$3.990',
      interval: 'month',
      currency: 'CLP',
      features: ['Servicio completo incluido'],
    },
    {
      id: 'quarterly',
      name: 'Premium Trimestral',
      amount: 11990,
      formattedAmount: '$11.990',
      interval: 'quarter',
      currency: 'CLP',
      features: ['Servicio completo incluido'],
    },
    {
      id: 'semestral',
      name: 'Premium Semestral',
      amount: 20990,
      formattedAmount: '$20.990',
      interval: 'semester',
      currency: 'CLP',
      features: ['Servicio completo incluido'],
    },
    {
      id: 'yearly',
      name: 'Premium Anual',
      amount: 39990,
      formattedAmount: '$39.990',
      interval: 'year',
      currency: 'CLP',
      features: ['Servicio completo incluido'],
    },
  ];

  // Cargar planes y estado de suscripción
  const loadData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      // TEMPORAL: Usar planes hardcodeados
      // TODO: Reemplazar con llamada al backend/StoreKit en próxima versión
      setPlans(HARDCODED_PLANS);

      // Cargar estado de suscripción del backend
      const statusResponse = await paymentService.getSubscriptionStatus();
      if (statusResponse.success) {
        setSubscriptionStatus(statusResponse);
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError(TEXTS.ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos al montar y cuando la pantalla recibe foco
  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Manejar selección de plan y suscripción
  const handleSubscribe = useCallback(async (plan) => {
    if (subscribing) return;

    try {
      setSubscribing(true);
      setSelectedPlan(plan.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // En iOS, usar StoreKit
      if (Platform.OS === 'ios' && storeKitService.isAvailable()) {
        const purchaseResult = await paymentService.purchaseWithStoreKit(plan.id);
        
        if (purchaseResult.success) {
          Alert.alert(
            '¡Suscripción exitosa!',
            'Tu suscripción se ha activado correctamente.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Recargar datos para actualizar el estado
                  loadData();
                }
              }
            ]
          );
        } else if (purchaseResult.cancelled) {
          // Usuario canceló, no mostrar error
          console.log('Compra cancelada por el usuario');
        } else {
          Alert.alert(
            TEXTS.SUBSCRIBE_ERROR,
            purchaseResult.error || 'Ocurrió un error al procesar tu suscripción'
          );
        }
        return;
      }

      // En Android, usar Mercado Pago (comportamiento original)
      const checkoutResponse = await paymentService.createCheckoutSession(plan.id);

      if (!checkoutResponse.success) {
        Alert.alert(
          TEXTS.SUBSCRIBE_ERROR,
          checkoutResponse.error || 'No se pudo crear la sesión de pago'
        );
        return;
      }

      // Validar que la URL sea válida
      if (!checkoutResponse.url) {
        Alert.alert(
          TEXTS.SUBSCRIBE_ERROR,
          'No se recibió una URL válida para el pago'
        );
        return;
      }

      // Intentar abrir en navegador externo primero (más confiable para Mercado Pago)
      // Si el usuario cancela o hay error, mostrar WebView como fallback
      const { Linking } = require('react-native');
      const canOpen = await Linking.canOpenURL(checkoutResponse.url);
      
      if (canOpen) {
        // Preguntar al usuario cómo prefiere abrir el pago
        Alert.alert(
          'Método de pago',
          '¿Cómo prefieres realizar el pago?',
          [
            {
              text: 'En la app',
              onPress: () => {
                setPaymentUrl(checkoutResponse.url);
                setShowPaymentWebView(true);
              }
            },
            {
              text: 'En navegador',
              style: 'default',
              onPress: async () => {
                try {
                  await Linking.openURL(checkoutResponse.url);
                  // Después de abrir en navegador, mostrar mensaje informativo
                  Alert.alert(
                    'Pago en proceso',
                    'Se abrió Mercado Pago en tu navegador. Una vez completado el pago, vuelve a la app para ver tu suscripción actualizada.',
                    [{ text: 'Entendido' }]
                  );
                } catch (error) {
                  console.error('Error abriendo URL:', error);
                  // Fallback a WebView si falla abrir en navegador
                  setPaymentUrl(checkoutResponse.url);
                  setShowPaymentWebView(true);
                }
              }
            },
            {
              text: 'Cancelar',
              style: 'cancel'
            }
          ]
        );
      } else {
        // Si no se puede abrir en navegador, usar WebView directamente
        setPaymentUrl(checkoutResponse.url);
        setShowPaymentWebView(true);
      }
    } catch (err) {
      console.error('Error en suscripción:', err);
      Alert.alert(
        TEXTS.SUBSCRIBE_ERROR,
        err.message || 'Ocurrió un error al procesar tu suscripción'
      );
    } finally {
      setSubscribing(false);
      setSelectedPlan(null);
    }
  }, [subscribing, loadData]);

  // Manejar cancelación de suscripción
  const handleCancelSubscription = useCallback(() => {
    Alert.alert(
      TEXTS.CANCEL_SUBSCRIPTION,
      TEXTS.CANCEL_CONFIRM,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await paymentService.cancelSubscription(false);
              if (response.success) {
                Alert.alert('Éxito', TEXTS.CANCEL_SUCCESS);
                loadData(); // Recargar datos
              } else {
                Alert.alert('Error', response.error || TEXTS.CANCEL_ERROR);
              }
            } catch (err) {
              Alert.alert('Error', TEXTS.CANCEL_ERROR);
            }
          },
        },
      ]
    );
  }, [loadData]);

  // Manejar restauración de compras (iOS)
  const handleRestorePurchases = useCallback(async () => {
    if (Platform.OS !== 'ios' || !storeKitService.isAvailable()) {
      Alert.alert('Información', 'La restauración de compras solo está disponible en iOS.');
      return;
    }

    try {
      setSubscribing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const result = await paymentService.restorePurchases();

      if (result.success) {
        if (result.purchases.length > 0) {
          Alert.alert(
            'Compras restauradas',
            `Se restauraron ${result.purchases.length} compra(s). Tu suscripción ha sido actualizada.`,
            [
              {
                text: 'OK',
                onPress: () => {
                  loadData(); // Recargar datos
                }
              }
            ]
          );
        } else {
          Alert.alert(
            'Sin compras',
            'No se encontraron compras para restaurar.'
          );
        }
      } else {
        Alert.alert(
          'Error',
          result.error || 'No se pudieron restaurar las compras'
        );
      }
    } catch (err) {
      console.error('Error restaurando compras:', err);
      Alert.alert(
        'Error',
        'Ocurrió un error al restaurar las compras'
      );
    } finally {
      setSubscribing(false);
    }
  }, [loadData]);

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

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>{TEXTS.RETRY}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Estado de suscripción actual */}
        {subscriptionStatus && subscriptionStatus.hasSubscription && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{TEXTS.CURRENT_SUBSCRIPTION}</Text>
            <SubscriptionStatus
              status={subscriptionStatus.status}
              plan={subscriptionStatus.plan}
              daysRemaining={subscriptionStatus.daysRemaining}
              trialEndDate={subscriptionStatus.trialEndDate}
              subscriptionEndDate={subscriptionStatus.subscriptionEndDate}
            />
            {(subscriptionStatus.status === 'premium' || subscriptionStatus.status === 'active') && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelSubscription}
              >
                <MaterialCommunityIcons name="cancel" size={20} color={colors.error} />
                <Text style={styles.cancelButtonText}>{TEXTS.CANCEL_SUBSCRIPTION}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Planes disponibles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{TEXTS.AVAILABLE_PLANS}</Text>
          <Text style={styles.subtitle}>{TEXTS.SUBTITLE}</Text>
          {plans.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{TEXTS.NO_PLANS}</Text>
            </View>
          ) : (
            plans
              .sort((a, b) => {
                // Ordenar planes: semanal, mensual, trimestral, semestral, anual
                const order = { weekly: 1, monthly: 2, quarterly: 3, semestral: 4, yearly: 5 };
                return (order[a.id] || 99) - (order[b.id] || 99);
              })
              .map((plan) => {
                const isCurrentPlan = subscriptionStatus?.plan === plan.id;
                // Marcar anual como recomendado (mejor valor por mes)
                const isRecommended = plan.id === 'yearly';
                const isSelected = selectedPlan === plan.id;

                return (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    isSelected={isSelected}
                    isCurrentPlan={isCurrentPlan}
                    isRecommended={isRecommended}
                    onSelect={handleSubscribe}
                    disabled={subscribing || isCurrentPlan}
                  />
                );
              })
          )}

          {/* Botón para restaurar compras (solo iOS) */}
          {Platform.OS === 'ios' && storeKitService.isAvailable() && (
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestorePurchases}
              disabled={subscribing}
            >
              <MaterialCommunityIcons 
                name="restore" 
                size={20} 
                color={colors.primary} 
              />
              <Text style={styles.restoreButtonText}>
                {subscribing ? 'Restaurando...' : 'Restaurar Compras'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Información adicional */}
        <View style={styles.infoSection}>
          <MaterialCommunityIcons name="information" size={20} color={colors.textSecondary} />
          <Text style={styles.infoText}>
            {Platform.OS === 'ios' 
              ? 'Los pagos se procesan de forma segura a través de App Store. Puedes cancelar tu suscripción en cualquier momento desde Configuración de Apple.'
              : 'Todos los pagos son procesados de forma segura por Mercado Pago. Puedes cancelar tu suscripción en cualquier momento.'}
          </Text>
        </View>
      </ScrollView>
    );
  };

  // Manejar éxito del pago
  const handlePaymentSuccess = () => {
    setShowPaymentWebView(false);
    setPaymentUrl(null);
    Alert.alert(
      '¡Pago exitoso!',
      'Tu suscripción ha sido activada correctamente.',
      [
        {
          text: 'Entendido',
          onPress: () => {
            loadData(); // Recargar datos para mostrar el nuevo estado
          },
        },
      ]
    );
  };

  // Manejar cancelación del pago
  const handlePaymentCancel = () => {
    setShowPaymentWebView(false);
    setPaymentUrl(null);
    Alert.alert(
      'Pago cancelado',
      'El pago fue cancelado. Puedes intentar nuevamente cuando lo desees.',
      [{ text: 'Entendido' }]
    );
  };

  // Manejar error en el pago
  const handlePaymentError = (errorMessage) => {
    setShowPaymentWebView(false);
    setPaymentUrl(null);
    Alert.alert(
      TEXTS.SUBSCRIBE_ERROR,
      errorMessage || 'Ocurrió un error durante el proceso de pago. Por favor, intenta nuevamente.'
    );
  };

  // Si se está mostrando el WebView de pago, renderizarlo
  if (showPaymentWebView && paymentUrl) {
    // Validar que la URL sea válida antes de mostrar el WebView
    let isValidUrl = false;
    try {
      const urlObj = new URL(paymentUrl);
      isValidUrl = urlObj.protocol.startsWith('http');
    } catch (e) {
      console.error('URL inválida:', paymentUrl);
      Alert.alert(
        'Error',
        'La URL de pago no es válida. Por favor, intenta nuevamente.'
      );
      setShowPaymentWebView(false);
      setPaymentUrl(null);
      return null;
    }

    if (!isValidUrl) {
      Alert.alert(
        'Error',
        'La URL de pago no es válida. Por favor, intenta nuevamente.'
      );
      setShowPaymentWebView(false);
      setPaymentUrl(null);
      return null;
    }

    return (
      <PaymentWebView
        url={paymentUrl}
        onClose={() => {
          setShowPaymentWebView(false);
          setPaymentUrl(null);
        }}
        onSuccess={handlePaymentSuccess}
        onCancel={handlePaymentCancel}
        onError={handlePaymentError}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 12,
    gap: 8,
  },
  cancelButtonText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  restoreButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default SubscriptionScreen;

