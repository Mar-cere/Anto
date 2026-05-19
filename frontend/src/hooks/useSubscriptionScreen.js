/**
 * Hook con la lógica de la pantalla de Suscripción (planes, estado, compra StoreKit/Mercado Pago, cancelación, restauración).
 * @author AntoApp Team
 */

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import paymentService from '../services/paymentService';
import storeKitService from '../services/storeKitService';
import {
  HARDCODED_PLANS,
  useSubscriptionTexts,
} from '../screens/subscription/subscriptionScreenConstants';
import { API_URL } from '../config/api';
import { useToast } from '../context/ToastContext';
import { subscriptionLooksCurrentlyUsable } from '../utils/subscriptionAccess';

function extractErrorCode(errorLike) {
  const directErrorCode = String(errorLike?.errorCode || '').trim();
  if (directErrorCode) return directErrorCode.toUpperCase();

  const backendCode = String(errorLike?.response?.data?.code || '').trim();
  if (backendCode) return backendCode.toUpperCase();

  const directCode = String(errorLike?.code || '').trim();
  if (directCode) return directCode.toUpperCase();

  return '';
}

function resolveCheckoutErrorMessageByCode(errorLike, texts) {
  const code = extractErrorCode(errorLike);
  if (code === 'NETWORK_ERROR') {
    return texts.PAYMENT_ERROR_CONNECTION || texts.CHECKOUT_SESSION_ERROR;
  }
  if (code === 'TIMEOUT' || code === 'ETIMEDOUT') {
    return texts.PAYMENT_ERROR_TIMEOUT || texts.CHECKOUT_SESSION_ERROR;
  }
  return texts.CHECKOUT_SESSION_ERROR;
}

function resolveCancelErrorMessageByCode(errorLike, texts) {
  const code = extractErrorCode(errorLike);
  if (code === 'NETWORK_ERROR') {
    return texts.PAYMENT_ERROR_CONNECTION || texts.CANCEL_ERROR;
  }
  if (code === 'TIMEOUT' || code === 'ETIMEDOUT') {
    return texts.PAYMENT_ERROR_TIMEOUT || texts.CANCEL_ERROR;
  }
  return texts.CANCEL_ERROR;
}

function resolvePurchaseErrorMessageByCode(errorLike, texts, fallbackMessage) {
  const code = extractErrorCode(errorLike);
  switch (code) {
    case 'VALIDATION_NETWORK':
      return texts.SUBSCRIPTION_VALIDATION_NETWORK;
    case 'VALIDATION_ERROR':
      return texts.SUBSCRIPTION_VALIDATION_ERROR;
    case 'PRODUCT_UNAVAILABLE':
      return texts.SUBSCRIPTION_PRODUCT_UNAVAILABLE;
    case 'APPSTORE_UNAVAILABLE':
      return texts.SUBSCRIPTION_APPSTORE_UNAVAILABLE;
    case 'TECHNICAL_ERROR':
      return texts.SUBSCRIPTION_TECH_ERROR;
    default:
      return fallbackMessage;
  }
}

function localizePlanName(planId, texts, fallbackName) {
  switch (String(planId || '').toLowerCase()) {
    case 'monthly':
      return texts.PLAN_NAME_MONTHLY || fallbackName;
    case 'quarterly':
      return texts.PLAN_NAME_QUARTERLY || fallbackName;
    case 'semestral':
      return texts.PLAN_NAME_SEMESTRAL || fallbackName;
    case 'yearly':
      return texts.PLAN_NAME_YEARLY || fallbackName;
    default:
      return fallbackName;
  }
}

export function useSubscriptionScreen() {
  const TEXTS = useSubscriptionTexts();
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
      setPlans(
        HARDCODED_PLANS.map((plan) => ({
          ...plan,
          name: localizePlanName(plan.id, TEXTS, plan.name),
        })),
      );
      try {
        const statusResponse = await paymentService.getSubscriptionStatus();
        if (statusResponse.success) {
          setSubscriptionStatus(statusResponse);
        } else {
          setSubscriptionStatus(null);
        }
      } catch {
        setSubscriptionStatus(null);
      }
    } catch {
      setError(TEXTS.ERROR);
    } finally {
      setLoading(false);
    }
  }, [TEXTS]);

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
                message: TEXTS.PAYMENT_VERIFIED_ACTIVE,
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
        message: TEXTS.PAYMENT_RETURN_VALIDATING,
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
          message: TEXTS.PAYMENT_CANCELLED_RETRY,
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
  }, [loadData, showToast, TEXTS]);

  const handleSubscribe = useCallback(
    async (planIdOrPlan) => {
      const plan =
        typeof planIdOrPlan === 'string'
          ? plans.find((p) => p && p.id === planIdOrPlan) || { id: planIdOrPlan }
          : planIdOrPlan;
      if (subscribing) return;
      if (!plan || !plan.id) {
        showToast({ message: TEXTS.INVALID_PLAN, type: 'warning' });
        return;
      }
      if (subscriptionStatus?.hasSubscription && subscriptionLooksCurrentlyUsable(subscriptionStatus)) {
        const currentPlan = subscriptionStatus.plan || TEXTS.PLAN_UNKNOWN;
        const daysRemaining = subscriptionStatus.daysRemaining;
        const message = daysRemaining
          ? TEXTS.ALREADY_ACTIVE_WITH_DAYS.replace('{plan}', String(currentPlan)).replace(
              '{days}',
              String(daysRemaining),
            )
          : TEXTS.ALREADY_ACTIVE_NO_DAYS.replace('{plan}', String(currentPlan));
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
              const msg = TEXTS.APPSTORE_CONNECT_ERROR;
              const hint = TEXTS.APPSTORE_BUILD_HINT;
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
                  message: TEXTS.STORE_PRODUCTS_LOAD_ERROR,
                  type: 'error',
                });
                return;
              }
            }
            const purchaseResult = await paymentService.purchaseWithStoreKit(plan.id);
            if (!purchaseResult) {
              throw new Error(TEXTS.SUBSCRIPTION_UNEXPECTED_ERROR);
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
              showToast({ message: TEXTS.SUBSCRIPTION_ACTIVATED, type: 'success' });
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
                    message: TEXTS.SUBSCRIPTION_ALREADY_ACTIVE,
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

              const errorMessage = resolvePurchaseErrorMessageByCode(
                purchaseResult,
                TEXTS,
                TEXTS.SUBSCRIPTION_GENERIC_ERROR,
              );
              if (purchaseResult.purchase) setTimeout(() => loadData(), 2000);
              showToast({ message: errorMessage, type: 'error', duration: 5000 });
            }
          } catch (error) {
            showToast({
              message: resolvePurchaseErrorMessageByCode(
                error,
                TEXTS,
                TEXTS.SUBSCRIPTION_UNEXPECTED_ERROR,
              ),
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
            message: TEXTS.IOS_NO_IAP_BUILD,
            type: 'error',
            duration: 10000,
          });
          return;
        }
        const checkoutResponse = await paymentService.createCheckoutSession(plan.id, PAYMENT_SUCCESS_RETURN_URL, null);
        if (!checkoutResponse?.success) {
          showToast({
            message: resolveCheckoutErrorMessageByCode(checkoutResponse, TEXTS),
            type: 'error',
          });
          return;
        }
        if (!checkoutResponse.url) {
          showToast({ message: TEXTS.CHECKOUT_URL_INVALID, type: 'error' });
          return;
        }
        const canOpen = await Linking.canOpenURL(checkoutResponse.url);
        if (canOpen) {
          try {
            await Linking.openURL(checkoutResponse.url);
            setPendingPaymentVerification(true);
            showToast({
              message: TEXTS.MERCADOPAGO_OPENED_BROWSER,
              type: 'info',
            });
          } catch {
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
          message: resolveCheckoutErrorMessageByCode(err, TEXTS),
          type: 'error',
        });
      } finally {
        setSubscribing(false);
        setSelectedPlan(null);
      }
    },
    [
      subscribing,
      loadData,
      plans,
      subscriptionStatus,
      navigation,
      showToast,
      TEXTS,
      PAYMENT_SUCCESS_RETURN_URL,
    ]
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
      TEXTS.CANCEL_CONFIRM + TEXTS.CANCEL_CONFIRM_SUFFIX,
      [
        { text: TEXTS.CANCEL_NO, style: 'cancel' },
        {
          text: TEXTS.CANCEL_YES,
          style: 'destructive',
          onPress: async () => {
            try {
              setSubscribing(true);
              const response = await paymentService.cancelSubscription(false);
              if (response.success) {
                showToast({
                  message: TEXTS.CANCELLED_PERIOD_END,
                  type: 'success',
                });
                await loadData();
              } else {
                showToast({
                  message: resolveCancelErrorMessageByCode(response, TEXTS),
                  type: 'error',
                });
              }
            } catch (err) {
              showToast({
                message: resolveCancelErrorMessageByCode(err, TEXTS),
                type: 'error',
              });
            } finally {
              setSubscribing(false);
            }
          },
        },
      ]
    );
  }, [loadData, showToast, TEXTS]);

  const handleCancelSubscription = useCallback(() => {
    const currentPlanId = subscriptionStatus?.plan;
    const cheaperPlans = getCheaperPlans(currentPlanId);
    if (cheaperPlans.length > 0) {
      const text = cheaperPlans.map((p) => `• ${p.name} - ${p.formattedAmount}`).join('\n');
      Alert.alert(
        TEXTS.CHEAPER_PLAN_TITLE,
        `${TEXTS.CHEAPER_PLAN_MESSAGE_PREFIX}\n\n${text}\n\n${TEXTS.CHEAPER_PLAN_MESSAGE_SUFFIX}`,
        [
          {
            text: TEXTS.CHEAPER_PLAN_VIEW,
            onPress: () => {
              const options = cheaperPlans.map((p) => ({
                text: `${p.name} - ${p.formattedAmount}`,
                onPress: () => handleSubscribe(p.id),
              }));
              Alert.alert(
                TEXTS.CHEAPER_PLAN_PICK_TITLE,
                TEXTS.CHEAPER_PLAN_PICK_MESSAGE,
                [
                  ...options,
                  {
                    text: TEXTS.CANCEL_SUBSCRIPTION_ACTION,
                    style: 'destructive',
                    onPress: confirmCancelSubscription,
                  },
                  { text: TEXTS.BACK, style: 'cancel' },
                ]
              );
            },
          },
          {
            text: TEXTS.CANCEL_SUBSCRIPTION_ACTION,
            style: 'destructive',
            onPress: confirmCancelSubscription,
          },
          { text: TEXTS.BACK, style: 'cancel' },
        ]
      );
    } else {
      confirmCancelSubscription();
    }
  }, [subscriptionStatus, getCheaperPlans, handleSubscribe, confirmCancelSubscription, TEXTS]);

  const handleRestorePurchases = useCallback(async () => {
    if (Platform.OS !== 'ios' || !storeKitService.isAvailable()) {
      showToast({
        message: TEXTS.RESTORE_IOS_ONLY,
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
            message: TEXTS.RESTORE_SUCCESS_COUNT.replace(
              '{count}',
              String(result.purchases.length),
            ),
            type: 'success',
          });
          await loadData();
        } else {
          showToast({
            message: TEXTS.RESTORE_NONE,
            type: 'default',
            duration: 4000,
          });
        }
      } else {
        const restoreErrorCode = extractErrorCode(result);
        if (restoreErrorCode === 'RESTORE_CANCELLED') {
          showToast({ message: TEXTS.RESTORE_CANCELLED, type: 'info' });
        } else {
          showToast({ message: TEXTS.RESTORE_ERROR, type: 'error' });
        }
      }
    } catch {
      showToast({ message: TEXTS.RESTORE_GENERIC_ERROR, type: 'error' });
    } finally {
      setSubscribing(false);
    }
  }, [loadData, showToast, TEXTS]);

  const handlePaymentSuccess = useCallback(() => {
    setShowPaymentWebView(false);
    setPaymentUrl(null);
    setPendingPaymentVerification(false);
    showToast({
      message: TEXTS.PAYMENT_SUCCESS_TOAST,
      type: 'success',
    });
    loadData();
  }, [loadData, showToast, TEXTS]);

  const handlePaymentCancel = useCallback(() => {
    setShowPaymentWebView(false);
    setPaymentUrl(null);
    setPendingPaymentVerification(false);
    showToast({
      message: TEXTS.PAYMENT_CANCEL_TOAST,
      type: 'info',
    });
  }, [showToast, TEXTS]);

  const handlePaymentError = useCallback((errorMessage) => {
    setShowPaymentWebView(false);
    setPaymentUrl(null);
    setPendingPaymentVerification(false);
    showToast({
      message: errorMessage || TEXTS.PAYMENT_ERROR_TOAST,
      type: 'error',
    });
  }, [showToast, TEXTS]);

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
