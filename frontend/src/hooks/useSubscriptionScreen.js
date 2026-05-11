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
import { API_URL } from '../config/api';
import { useToast } from '../context/ToastContext';
import { subscriptionLooksCurrentlyUsable } from '../utils/subscriptionAccess';

export function useSubscriptionScreen() {
  const navigation = useNavigation();
  const { showToast } = useToast();
  const [plans, setPlans] = useState([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [error, setError] = useState(null);
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [pendingPaymentVerification, setPendingPaymentVerification] = useState(false);
  const PAYMENT_SUCCESS_DEEP_LINK = 'anto://payments/success';
  const PAYMENT_CANCEL_DEEP_LINK = 'anto://payments/cancel';
  const apiBase = (API_URL || '').replace(/\/$/, '');
  const PAYMENT_SUCCESS_RETURN_URL = `${apiBase}/api/payments/return/success`;

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
      let cancelled = false;
      const verifySubscriptionWithRetries = async () => {
        let attempts = 5;
        while (attempts > 0 && !cancelled) {
          try {
            const status = await paymentService.getSubscriptionStatus();
            if (subscriptionLooksCurrentlyUsable(status)) {
              setPendingPaymentVerification(false);
              await loadData();
              return true;
            }
          } catch (_) {}
          attempts -= 1;
          if (attempts > 0) {
            await new Promise((r) => setTimeout(r, 2000));
          }
        }
        return false;
      };

      const syncAfterFocus = async () => {
        await loadData();
        if (!pendingPaymentVerification || cancelled) return;
        await verifySubscriptionWithRetries();
      };
      syncAfterFocus();
      return () => {
        cancelled = true;
      };
    }, [loadData, pendingPaymentVerification])
  );

  useEffect(() => {
    let cancelled = false;

    const verifyAfterDeepLink = async () => {
      let attempts = 5;
      while (attempts > 0 && !cancelled) {
        try {
          const status = await paymentService.getSubscriptionStatus();
          if (subscriptionLooksCurrentlyUsable(status)) {
            setPendingPaymentVerification(false);
            await loadData();
            showToast({
              message: 'Tu suscripción fue validada y activada.',
              type: 'success',
            });
            return;
          }
        } catch (_) {}
        attempts -= 1;
        if (attempts > 0) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
      showToast({
        message: 'Detectamos el retorno de pago. Estamos validando tu suscripción; revisa de nuevo en unos segundos.',
        type: 'default',
        duration: 4500,
      });
    };

    const handleUrl = (incomingUrl) => {
      if (!incomingUrl || typeof incomingUrl !== 'string') return;
      if (incomingUrl.startsWith(PAYMENT_SUCCESS_DEEP_LINK)) {
        setPendingPaymentVerification(true);
        setShowPaymentWebView(false);
        setPaymentUrl(null);
        verifyAfterDeepLink();
      } else if (incomingUrl.startsWith(PAYMENT_CANCEL_DEEP_LINK)) {
        setPendingPaymentVerification(false);
        setShowPaymentWebView(false);
        setPaymentUrl(null);
        showToast({
          message: 'Cancelaste el pago. Puedes intentarlo nuevamente cuando quieras.',
          type: 'info',
        });
      }
    };

    Linking.getInitialURL()
      .then((initialUrl) => {
        if (!cancelled) handleUrl(initialUrl);
      })
      .catch(() => {});

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [loadData, showToast]);

  const handleSubscribe = useCallback(
    async (planIdOrPlan) => {
      const plan =
        typeof planIdOrPlan === 'string'
          ? plans.find((p) => p && p.id === planIdOrPlan) || { id: planIdOrPlan }
          : planIdOrPlan;
      if (subscribing) return;
      if (!plan || !plan.id) {
        showToast({ message: 'Plan no válido. Vuelve a elegir un plan.', type: 'warning' });
        return;
      }
      if (subscriptionStatus?.hasSubscription && subscriptionLooksCurrentlyUsable(subscriptionStatus)) {
        const currentPlan = subscriptionStatus.plan || 'desconocido';
        const daysRemaining = subscriptionStatus.daysRemaining;
        const message = daysRemaining
          ? `Ya tienes ${currentPlan} activa (${daysRemaining} día(s)). Puedes elegir otro plan o volver atrás.`
          : `Ya tienes ${currentPlan} activa. Puedes elegir otro plan si lo necesitas.`;
        showToast({ message, type: 'info', duration: 4500 });
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
              const msg = initResult.error || 'No se pudo conectar con App Store.';
              const hint = 'Usa un build nativo (no Expo Go) e inicia sesión con una cuenta Sandbox en Ajustes > App Store.';
              showToast({ message: `${msg} ${hint}`, type: 'error', duration: 6000 });
              return;
            }
            const products = storeKitService.getProducts();
            if (!products || products.length === 0) {
              const loadResult = await storeKitService.loadProducts();
              if (!loadResult.success || !loadResult.products?.length) {
                setSubscribing(false);
                setSelectedPlan(null);
                showToast({
                  message: loadResult.error || 'No se pudieron cargar los productos de la tienda.',
                  type: 'error',
                });
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
                  if (subscriptionLooksCurrentlyUsable(newStatus)) statusUpdated = true;
                  else await new Promise((r) => setTimeout(r, 1000));
                } catch (_) {}
                retries--;
              }
              showToast({ message: '¡Suscripción activada correctamente!', type: 'success' });
              await loadData();
              navigation.goBack();
            } else if (!purchaseResult.cancelled) {
              // Si App Store falla pero el backend ya reporta una suscripción activa,
              // interpretamos esto como un "no-op" (por ejemplo: "Ya estás suscrito").
              try {
                await loadData();
                const newStatus = await paymentService.getSubscriptionStatus();
                if (subscriptionLooksCurrentlyUsable(newStatus)) {
                  showToast({
                    message: 'Tu suscripción ya estaba activa. Estado actualizado.',
                    type: 'default',
                    duration: 4000,
                  });
                  await loadData();
                  navigation.goBack();
                  return;
                }
              } catch (_) {
                // Si falla la consulta de estado, seguimos con el flujo de error normal
              }

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
              showToast({ message: errorMessage, type: 'error', duration: 5000 });
            }
          } catch (error) {
            showToast({
              message: error?.message || 'Ocurrió un error inesperado al suscribirte.',
              type: 'error',
            });
          } finally {
            setSubscribing(false);
            setSelectedPlan(null);
          }
          return;
        }
        if (Platform.OS === 'ios' && !storeKitService.isAvailable()) {
          showToast({
            message:
              'En iOS las suscripciones se pagan con App Store. Esta instalación no tiene compras in-app (por ejemplo Expo Go o un binario sin IAP). Instala desde TestFlight o recompila con expo-in-app-purchases. En Android se usa Mercado Pago.',
            type: 'error',
            duration: 10000,
          });
          return;
        }
        const checkoutResponse = await paymentService.createCheckoutSession(plan.id, PAYMENT_SUCCESS_RETURN_URL, null);
        if (!checkoutResponse?.success) {
          showToast({
            message: checkoutResponse?.error || 'No se pudo crear la sesión de pago.',
            type: 'error',
          });
          return;
        }
        if (!checkoutResponse.url) {
          showToast({ message: 'No se recibió una URL válida para el pago.', type: 'error' });
          return;
        }
        const canOpen = await Linking.canOpenURL(checkoutResponse.url);
        if (canOpen) {
          try {
            await Linking.openURL(checkoutResponse.url);
            setPendingPaymentVerification(true);
            showToast({
              message: 'Se abrió Mercado Pago en tu navegador. Cuando termines, vuelve a la app.',
              type: 'info',
            });
          } catch (e) {
            setPaymentUrl(checkoutResponse.url);
            setShowPaymentWebView(true);
            setPendingPaymentVerification(true);
          }
        } else {
          setPaymentUrl(checkoutResponse.url);
          setShowPaymentWebView(true);
          setPendingPaymentVerification(true);
        }
      } catch (err) {
        showToast({
          message: err.message || 'Ocurrió un error al procesar tu suscripción.',
          type: 'error',
        });
      } finally {
        setSubscribing(false);
        setSelectedPlan(null);
      }
    },
    [subscribing, loadData, plans, subscriptionStatus, navigation, showToast]
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
                showToast({
                  message: 'Suscripción cancelada. Seguirás teniendo acceso hasta el final del período actual.',
                  type: 'success',
                });
                await loadData();
              } else {
                showToast({ message: response.error || TEXTS.CANCEL_ERROR, type: 'error' });
              }
            } catch (err) {
              showToast({ message: getApiErrorMessage(err) || TEXTS.CANCEL_ERROR, type: 'error' });
            } finally {
              setSubscribing(false);
            }
          },
        },
      ]
    );
  }, [loadData, showToast]);

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
      showToast({
        message: 'La restauración de compras solo está disponible en iOS con la app instalada desde la tienda.',
        type: 'info',
        duration: 4500,
      });
      return;
    }
    try {
      setSubscribing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const result = await paymentService.restorePurchases();
      if (result.success) {
        if (result.purchases?.length > 0) {
          showToast({
            message: `Se restauraron ${result.purchases.length} compra(s).`,
            type: 'success',
          });
          await loadData();
        } else {
          showToast({
            message: 'No se encontraron compras de esta cuenta para restaurar.',
            type: 'default',
            duration: 4000,
          });
        }
      } else {
        showToast({ message: result.error || 'No se pudieron restaurar las compras.', type: 'error' });
      }
    } catch (err) {
      showToast({ message: 'Ocurrió un error al restaurar las compras.', type: 'error' });
    } finally {
      setSubscribing(false);
    }
  }, [loadData, showToast]);

  const handlePaymentSuccess = useCallback(() => {
    setShowPaymentWebView(false);
    setPaymentUrl(null);
    setPendingPaymentVerification(false);
    showToast({
      message: 'Tu suscripción ha sido activada correctamente.',
      type: 'success',
    });
    loadData();
  }, [loadData, showToast]);

  const handlePaymentCancel = useCallback(() => {
    setShowPaymentWebView(false);
    setPaymentUrl(null);
    setPendingPaymentVerification(false);
    showToast({
      message: 'El pago fue cancelado. Puedes intentar nuevamente cuando lo desees.',
      type: 'info',
    });
  }, [showToast]);

  const handlePaymentError = useCallback((errorMessage) => {
    setShowPaymentWebView(false);
    setPaymentUrl(null);
    setPendingPaymentVerification(false);
    showToast({
      message: errorMessage || 'Ocurrió un error durante el proceso de pago.',
      type: 'error',
    });
  }, [showToast]);

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
