/**
 * Pantalla de Suscripción
 *
 * Planes, estado de suscripción, compra (StoreKit / Mercado Pago). Lógica en useSubscriptionScreen;
 * UI en SubscriptionLoadingView, SubscriptionErrorView, SubscriptionContent, SubscriptionLegalSection.
 *
 * @author AntoApp Team
 */

import React from 'react';
import { Alert, SafeAreaView, StatusBar, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';
import PaymentWebView from '../components/payments/PaymentWebView';
import FloatingNavBar from '../components/FloatingNavBar';
import SubscriptionContent from '../components/subscription/SubscriptionContent';
import SubscriptionErrorView from '../components/subscription/SubscriptionErrorView';
import SubscriptionLoadingView from '../components/subscription/SubscriptionLoadingView';
import { useSubscriptionScreen } from '../hooks/useSubscriptionScreen';
import { TEXTS } from './subscription/subscriptionScreenConstants';
import { colors } from '../styles/globalStyles';

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
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

  if (showPaymentWebView && paymentUrl) {
    let isValidUrl = false;
    try {
      const urlObj = new URL(paymentUrl);
      isValidUrl = urlObj.protocol.startsWith('http');
    } catch (e) {
      setShowPaymentWebView(false);
      setPaymentUrl(null);
      Alert.alert('Error', 'La URL de pago no es válida.');
      return null;
    }
    if (!isValidUrl) {
      setShowPaymentWebView(false);
      setPaymentUrl(null);
      Alert.alert('Error', 'La URL de pago no es válida.');
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
      <StatusBar barStyle="light-content" />
      <Header greeting="" userName="" showBackButton title={TEXTS.TITLE} />
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
