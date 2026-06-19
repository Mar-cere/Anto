/**
 * Pantalla de Suscripción
 *
 * Planes, estado de suscripción, compra (StoreKit / Mercado Pago). Lógica en useSubscriptionScreen;
 * UI en SubscriptionLoadingView, SubscriptionErrorView, SubscriptionContent, SubscriptionLegalSection.
 *
 * @author AntoApp Team
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Alert, SafeAreaView, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';
import PaymentWebView from '../components/payments/PaymentWebView';
import FloatingNavBar from '../components/FloatingNavBar';
import SubscriptionContent from '../components/subscription/SubscriptionContent';
import SubscriptionErrorView from '../components/subscription/SubscriptionErrorView';
import SubscriptionLoadingView from '../components/subscription/SubscriptionLoadingView';
import { useSubscriptionScreen } from '../hooks/useSubscriptionScreen';
import { useSubscriptionTexts } from './subscription/subscriptionScreenConstants';
import { useTheme } from '../context/ThemeContext';

export default function SubscriptionScreen() {
  const TEXTS = useSubscriptionTexts();
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle } = useTheme();
  const {
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
  } = useSubscriptionScreen();
  const invalidUrlHandledRef = useRef(false);

  const paymentUrlValidationError = useMemo(() => {
    if (!showPaymentWebView || !paymentUrl) return null;
    try {
      const urlObj = new URL(paymentUrl);
      if (!urlObj.protocol.startsWith('http')) {
        return TEXTS.INVALID_PAYMENT_URL;
      }
      return null;
    } catch (_) {
      return TEXTS.INVALID_PAYMENT_URL;
    }
  }, [showPaymentWebView, paymentUrl, TEXTS]);

  useEffect(() => {
    if (!paymentUrlValidationError) {
      invalidUrlHandledRef.current = false;
      return;
    }
    if (invalidUrlHandledRef.current) return;

    invalidUrlHandledRef.current = true;
    setShowPaymentWebView(false);
    setPaymentUrl(null);
    Alert.alert(TEXTS.ERROR, paymentUrlValidationError);
  }, [paymentUrlValidationError, setPaymentUrl, setShowPaymentWebView, TEXTS]);

  if (showPaymentWebView && paymentUrl) {
    if (paymentUrlValidationError) {
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
    <SafeAreaView style={[{ flex: 1, backgroundColor: colors.background }, { paddingTop: insets.top }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <Header greeting="" userName="" showBackButton title="" />
      {loading && <SubscriptionLoadingView />}
      {!loading && error && <SubscriptionErrorView error={error} onRetry={loadData} />}
      {!loading && !error && (
        <SubscriptionContent
          plans={plans}
          subscriptionStatus={subscriptionStatus}
          selectedPlan={selectedPlan}
          subscribing={subscribing}
          onSubscribe={handleSubscribe}
          onCancelSubscription={handleCancelSubscription}
          onRestorePurchases={handleRestorePurchases}
        />
      )}
      <FloatingNavBar />
    </SafeAreaView>
  );
}
