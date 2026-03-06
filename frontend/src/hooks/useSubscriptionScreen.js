/**
 * Hook con la lógica de la pantalla de Suscripción (planes, estado, compra StoreKit/Mercado Pago, cancelación, restauración).
 * @author AntoApp Team
 */

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import paymentService from '../services/paymentService';
import storeKitService from '../services/storeKitService';
import { getApiErrorMessage } from '../utils/apiErrorHandler';
import { HARDCODED_PLANS, TEXTS } from '../screens/subscription/subscriptionScreenConstants';

export function useSubscriptionScreen() {
  const navigation = useNavigation();
  const [plans, setPlans] = useState([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [error, setError] = useState(null);
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      setPlans(HARDCODED_PLANS);
      try {
        const statusResponse = await paymentService.getSubscriptionStatus();
        if (statusResponse.success) {
          setSubscriptionStatus(statusResponse);
        } else {
          setSubscriptionStatus(null);
        }
      } catch (statusError) {
        setSubscriptionStatus(null);
      }
    } catch (err) {
      setError(TEXTS.ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSubscribe = useCallback(
    async (planIdOrPlan) => {
      const plan =
        typeof planIdOrPlan === 'string'
          ? plans.find((p) => p && p.id === planIdOrPlan) || { id: planIdOrPlan }
          : planIdOrPlan;
      if (subscribing) return;
      if (!plan || !plan.id) {
        Alert.alert('Error', 'Plan no válido');
        return;
      }
      if (subscriptionStatus?.hasSubscription) {
        const status = subscriptionStatus.status;
        const isActive = status === 'premium' || status === 'active' || status === 'trialing';
        if (isActive) {
          const currentPlan = subscriptionStatus.plan || 'desconocido';
          const daysRemaining = subscriptionStatus.daysRemaining;
          const message = daysRemaining
            ? `Ya tienes una suscripción ${currentPlan} activa con ${daysRemaining} día(s) restante(s). ¿Deseas cambiar de plan?`
            : `Ya tienes una suscripción ${currentPlan} activa. ¿Deseas cambiar de plan?`;
          Alert.alert('Suscripción activa', message, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Continuar', onPress: () => {} },
          ]);
        }
      }
      try {
        setSubscribing(true);
        setSelectedPlan(plan.id);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (Platform.OS === 'ios' && storeKitService.isAvailable()) {
          try {
            const initResult = await storeKitService.initialize();
            if (!initResult.success) {
              setSubscribing(false);
              setSelectedPlan(null);
              Alert.alert(TEXTS.SUBSCRIBE_ERROR, initResult.error || 'No se pudo conectar con App Store.');
              return;
            }
            const products = storeKitService.getProducts();
            if (!products || products.length === 0) {
              const loadResult = await storeKitService.loadProducts();
              if (!loadResult.success || !loadResult.products?.length) {
                setSubscribing(false);
                setSelectedPlan(null);
                Alert.alert(TEXTS.SUBSCRIBE_ERROR, loadResult.error || 'No se pudieron cargar los productos.');
                return;
              }
            }
            const purchaseResult = await paymentService.purchaseWithStoreKit(plan.id);
            if (!purchaseResult) {
              throw new Error('No se recibió respuesta de la compra');
            }
            if (purchaseResult.success) {
              await new Promise((r) => setTimeout(r, 1500));
              let retries = 3;
              let statusUpdated = false;
              while (retries > 0 && !statusUpdated) {
                try {
                  await loadData();
                  const newStatus = await paymentService.getSubscriptionStatus();
                  if (newStatus?.success && newStatus?.hasSubscription) statusUpdated = true;
                  else await new Promise((r) => setTimeout(r, 1000));
                } catch (_) {}
                retries--;
              }
              Alert.alert('¡Suscripción exitosa!', 'Tu suscripción se ha activado correctamente.', [
                { text: 'OK', onPress: () => loadData().then(() => navigation.goBack()) },
              ]);
            } else if (!purchaseResult.cancelled) {
              let errorMessage = purchaseResult.error || 'Ocurrió un error al procesar tu suscripción';
              if (purchaseResult.validationError) {
                if (errorMessage.includes('conectar') || errorMessage.includes('servidor') || errorMessage.includes('Network')) {
                  errorMessage = 'No se pudo conectar con el servidor para validar tu compra. Verifica tu conexión e intenta de nuevo.';
                } else if (errorMessage.includes('recibo') || errorMessage.includes('validar')) {
                  errorMessage = 'Hubo un problema al validar tu compra. Intenta de nuevo o contacta soporte.';
                }
              } else if (errorMessage.includes('producto') || errorMessage.includes('no está disponible')) {
                errorMessage = 'El producto no está disponible en este momento. Intenta más tarde.';
              } else if (errorMessage.includes('App Store')) {
                errorMessage = 'No se pudo conectar con App Store. Verifica tu conexión e intenta de nuevo.';
              } else if (errorMessage.includes('undefined is not a function')) {
                errorMessage = 'Error técnico. Reinicia la app e intenta de nuevo.';
              }
              if (purchaseResult.purchase) setTimeout(() => loadData(), 2000);
              Alert.alert(TEXTS.SUBSCRIBE_ERROR, errorMessage);
            }
          } catch (error) {
            Alert.alert(TEXTS.SUBSCRIBE_ERROR, error?.message || 'Ocurrió un error inesperado.');
          } finally {
            setSubscribing(false);
            setSelectedPlan(null);
          }
          return;
        }
        const checkoutResponse = await paymentService.createCheckoutSession(plan.id);
        if (!checkoutResponse?.success) {
          Alert.alert(TEXTS.SUBSCRIBE_ERROR, checkoutResponse?.error || 'No se pudo crear la sesión de pago');
          return;
        }
        if (!checkoutResponse.url) {
          Alert.alert(TEXTS.SUBSCRIBE_ERROR, 'No se recibió una URL válida para el pago');
          return;
        }
        const canOpen = await Linking.canOpenURL(checkoutResponse.url);
        if (canOpen) {
          Alert.alert('Método de pago', '¿Cómo prefieres realizar el pago?', [
            {
              text: 'En la app',
              onPress: () => {
                setPaymentUrl(checkoutResponse.url);
                setShowPaymentWebView(true);
              },
            },
            {
              text: 'En navegador',
              onPress: async () => {
                try {
                  await Linking.openURL(checkoutResponse.url);
                  Alert.alert('Pago en proceso', 'Se abrió Mercado Pago. Cuando termines, vuelve a la app.', [{ text: 'Entendido' }]);
                } catch (e) {
                  setPaymentUrl(checkoutResponse.url);
                  setShowPaymentWebView(true);
                }
              },
            },
            { text: 'Cancelar', style: 'cancel' },
          ]);
        } else {
          setPaymentUrl(checkoutResponse.url);
          setShowPaymentWebView(true);
        }
      } catch (err) {
        Alert.alert(TEXTS.SUBSCRIBE_ERROR, err.message || 'Ocurrió un error al procesar tu suscripción');
      } finally {
        setSubscribing(false);
        setSelectedPlan(null);
      }
    },
    [subscribing, loadData, plans, subscriptionStatus, navigation]
  );

  const getCheaperPlans = useCallback((currentPlanId) => {
    if (!currentPlanId || !plans.length) return [];
    const planOrder = { monthly: 1, quarterly: 2, semestral: 3, yearly: 4 };
    const currentOrder = planOrder[currentPlanId] || 999;
    return plans
      .filter((p) => (planOrder[p.id] || 999) < currentOrder)
      .sort((a, b) => (planOrder[a.id] || 999) - (planOrder[b.id] || 999));
  }, [plans]);

  const confirmCancelSubscription = useCallback(async () => {
    Alert.alert(
      TEXTS.CANCEL_SUBSCRIPTION,
      TEXTS.CANCEL_CONFIRM + '\n\nTu suscripción seguirá activa hasta el final del período actual.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              setSubscribing(true);
              const response = await paymentService.cancelSubscription(false);
              if (response.success) {
                Alert.alert('Suscripción cancelada', 'Seguirás teniendo acceso hasta el final del período actual.', [
                  { text: 'OK', onPress: () => loadData() },
                ]);
              } else {
                Alert.alert('Error', response.error || TEXTS.CANCEL_ERROR);
              }
            } catch (err) {
              Alert.alert('Error', getApiErrorMessage(err) || TEXTS.CANCEL_ERROR);
            } finally {
              setSubscribing(false);
            }
          },
        },
      ]
    );
  }, [loadData]);

  const handleCancelSubscription = useCallback(() => {
    const currentPlanId = subscriptionStatus?.plan;
    const cheaperPlans = getCheaperPlans(currentPlanId);
    if (cheaperPlans.length > 0) {
      const text = cheaperPlans.map((p) => `• ${p.name} - ${p.formattedAmount}`).join('\n');
      Alert.alert(
        '¿Cambiar a un plan más económico?',
        `Antes de cancelar, ¿te gustaría cambiar a uno de estos planes?\n\n${text}\n\nO puedes cancelar completamente.`,
        [
          {
            text: 'Ver planes más baratos',
            onPress: () => {
              const options = cheaperPlans.map((p) => ({
                text: `${p.name} - ${p.formattedAmount}`,
                onPress: () => handleSubscribe(p.id),
              }));
              Alert.alert(
                'Planes más económicos',
                'Selecciona el plan:',
                [...options, { text: 'Cancelar suscripción', style: 'destructive', onPress: confirmCancelSubscription }, { text: 'Volver', style: 'cancel' }]
              );
            },
          },
          { text: 'Cancelar suscripción', style: 'destructive', onPress: confirmCancelSubscription },
          { text: 'Volver', style: 'cancel' },
        ]
      );
    } else {
      confirmCancelSubscription();
    }
  }, [subscriptionStatus, getCheaperPlans, handleSubscribe, confirmCancelSubscription]);

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
        if (result.purchases?.length > 0) {
          Alert.alert('Compras restauradas', `Se restauraron ${result.purchases.length} compra(s).`, [{ text: 'OK', onPress: loadData }]);
        } else {
          Alert.alert('Sin compras', 'No se encontraron compras para restaurar.');
        }
      } else {
        Alert.alert('Error', result.error || 'No se pudieron restaurar las compras');
      }
    } catch (err) {
      Alert.alert('Error', 'Ocurrió un error al restaurar las compras');
    } finally {
      setSubscribing(false);
    }
  }, [loadData]);

  const handlePaymentSuccess = useCallback(() => {
    setShowPaymentWebView(false);
    setPaymentUrl(null);
    Alert.alert('¡Pago exitoso!', 'Tu suscripción ha sido activada correctamente.', [{ text: 'Entendido', onPress: loadData }]);
  }, [loadData]);

  const handlePaymentCancel = useCallback(() => {
    setShowPaymentWebView(false);
    setPaymentUrl(null);
    Alert.alert('Pago cancelado', 'El pago fue cancelado. Puedes intentar nuevamente cuando lo desees.', [{ text: 'Entendido' }]);
  }, []);

  const handlePaymentError = useCallback((errorMessage) => {
    setShowPaymentWebView(false);
    setPaymentUrl(null);
    Alert.alert(TEXTS.SUBSCRIBE_ERROR, errorMessage || 'Ocurrió un error durante el proceso de pago.');
  }, []);

  return {
    plans,
    subscriptionStatus,
    loading,
    error,
    subscribing,
    selectedPlan,
    showPaymentWebView,
    paymentUrl,
    setShowPaymentWebView,
    setPaymentUrl,
    loadData,
    handleSubscribe,
    handleCancelSubscription,
    handleRestorePurchases,
    handlePaymentSuccess,
    handlePaymentCancel,
    handlePaymentError,
  };
}
