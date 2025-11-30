/**
 * Pantalla de Suscripción
 * 
 * Muestra los planes disponibles y permite al usuario suscribirse.
 * Incluye integración con Mercado Pago para procesar pagos.
 * 
 * @author AntoApp Team
 */

import React, { useState, useCallback, useEffect } from 'react';
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
import PlanCard from '../components/payments/PlanCard';
import SubscriptionStatus from '../components/payments/SubscriptionStatus';
import paymentService from '../services/paymentService';
import { colors } from '../styles/globalStyles';
import { Linking } from 'react-native';

// Constantes de textos
const TEXTS = {
  TITLE: 'Suscripción Premium',
  SUBTITLE: 'Elige el plan que mejor se adapte a ti',
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

  // Cargar planes y estado de suscripción
  const loadData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      // Cargar planes
      const plansResponse = await paymentService.getPlans();
      if (plansResponse.success) {
        setPlans(Object.values(plansResponse.plans || {}));
      } else {
        setError(plansResponse.error || TEXTS.ERROR);
      }

      // Cargar estado de suscripción
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

      // Crear sesión de checkout
      const checkoutResponse = await paymentService.createCheckoutSession(plan.id);

      if (!checkoutResponse.success) {
        Alert.alert(
          TEXTS.SUBSCRIBE_ERROR,
          checkoutResponse.error || 'No se pudo crear la sesión de pago'
        );
        return;
      }

      // Abrir URL de Mercado Pago
      const urlOpened = await paymentService.openPaymentUrl(checkoutResponse.url);

      if (!urlOpened) {
        Alert.alert(
          TEXTS.SUBSCRIBE_ERROR,
          'No se pudo abrir la página de pago. Por favor, intenta nuevamente.'
        );
        return;
      }

      // Mostrar mensaje informativo
      Alert.alert(
        TEXTS.OPENING_PAYMENT,
        'Serás redirigido a Mercado Pago para completar el pago. Una vez completado, serás redirigido de vuelta a la aplicación.',
        [{ text: 'Entendido' }]
      );
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
  }, [subscribing]);

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
        </View>

        {/* Información adicional */}
        <View style={styles.infoSection}>
          <MaterialCommunityIcons name="information" size={20} color={colors.textSecondary} />
          <Text style={styles.infoText}>
            Todos los pagos son procesados de forma segura por Mercado Pago.
            Puedes cancelar tu suscripción en cualquier momento.
          </Text>
        </View>
      </ScrollView>
    );
  };

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
    marginBottom: 16,
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

