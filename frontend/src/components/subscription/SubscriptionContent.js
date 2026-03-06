/**
 * Contenido principal de la pantalla Suscripción: estado actual, planes, info, enlaces legales.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PlanCard from '../payments/PlanCard';
import SubscriptionStatus from '../payments/SubscriptionStatus';
import storeKitService from '../../services/storeKitService';
import { LEGAL_URLS, TEXTS } from '../../screens/subscription/subscriptionScreenConstants';
import { colors } from '../../styles/globalStyles';
import SubscriptionLegalSection from './SubscriptionLegalSection';

const PLAN_ORDER = { monthly: 1, quarterly: 2, semestral: 3, yearly: 4 };

export default function SubscriptionContent({
  plans,
  subscriptionStatus,
  selectedPlan,
  subscribing,
  onSubscribe,
  onCancelSubscription,
  onRestorePurchases,
}) {
  const hasActiveSubscription =
    subscriptionStatus?.hasSubscription &&
    (subscriptionStatus?.status === 'premium' || subscriptionStatus?.status === 'active');
  const sortedPlans = [...(plans || [])].sort(
    (a, b) => (PLAN_ORDER[a.id] || 99) - (PLAN_ORDER[b.id] || 99)
  );

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <SubscriptionLegalSection />

      {subscriptionStatus?.hasSubscription && subscriptionStatus?.status && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{TEXTS.CURRENT_SUBSCRIPTION}</Text>
          <SubscriptionStatus
            status={subscriptionStatus.status || 'free'}
            plan={subscriptionStatus.plan || null}
            daysRemaining={subscriptionStatus.daysRemaining ?? null}
            trialEndDate={subscriptionStatus.trialEndDate ?? null}
            subscriptionEndDate={subscriptionStatus.subscriptionEndDate ?? null}
          />
          {hasActiveSubscription && (
            <TouchableOpacity style={styles.cancelButton} onPress={onCancelSubscription}>
              <MaterialCommunityIcons name="cancel" size={20} color={colors.error} />
              <Text style={styles.cancelButtonText}>{TEXTS.CANCEL_SUBSCRIPTION}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{TEXTS.AVAILABLE_PLANS}</Text>
        <Text style={styles.subtitle}>{TEXTS.SUBTITLE}</Text>
        <Text style={styles.agreementText}>
          {TEXTS.SUBSCRIBE_AGREEMENT}
          <Text style={styles.agreementLink} onPress={() => Linking.openURL(LEGAL_URLS.TERMS_EULA)}>
            {TEXTS.SUBSCRIBE_AGREEMENT_TERMS}
          </Text>
          {TEXTS.SUBSCRIBE_AGREEMENT_AND}
          <Text style={styles.agreementLink} onPress={() => Linking.openURL(LEGAL_URLS.PRIVACY)}>
            {TEXTS.SUBSCRIBE_AGREEMENT_PRIVACY}
          </Text>
          {TEXTS.SUBSCRIBE_AGREEMENT_END}
        </Text>
        {sortedPlans.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{TEXTS.NO_PLANS}</Text>
          </View>
        ) : (
          sortedPlans
            .filter((plan) => plan && plan.id)
            .map((plan) => {
              const isCurrentPlan =
                subscriptionStatus?.plan && plan.id && subscriptionStatus.plan === plan.id;
              const isRecommended = plan.id === 'yearly';
              const isSelected = selectedPlan === plan.id;
              const shouldDisable =
                subscribing ||
                isCurrentPlan ||
                (hasActiveSubscription && !isCurrentPlan);
              return (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isSelected={isSelected}
                  isCurrentPlan={!!isCurrentPlan}
                  isRecommended={isRecommended}
                  onSelect={onSubscribe}
                  disabled={shouldDisable}
                />
              );
            })
        )}
        {Platform.OS === 'ios' && storeKitService.isAvailable() && (
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={onRestorePurchases}
            disabled={subscribing}
          >
            <MaterialCommunityIcons name="restore" size={20} color={colors.primary} />
            <Text style={styles.restoreButtonText}>
              {subscribing ? 'Restaurando...' : 'Restaurar Compras'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.infoSection}>
        <MaterialCommunityIcons name="information" size={20} color={colors.textSecondary} />
        <Text style={styles.infoText}>
          {Platform.OS === 'ios'
            ? 'Los pagos se procesan de forma segura a través de App Store. Puedes cancelar tu suscripción en cualquier momento desde Configuración de Apple.'
            : 'Todos los pagos son procesados de forma segura por Mercado Pago. Puedes cancelar tu suscripción en cualquier momento.'}
        </Text>
      </View>

      <SubscriptionLegalSection compact />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: colors.white, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 16, lineHeight: 20 },
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
  cancelButtonText: { color: colors.error, fontSize: 16, fontWeight: '600' },
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
  restoreButtonText: { color: colors.primary, fontSize: 16, fontWeight: '600', marginLeft: 8 },
  emptyContainer: { padding: 32, alignItems: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: 16, textAlign: 'center' },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  infoText: { flex: 1, color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  agreementText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginBottom: 16 },
  agreementLink: { color: colors.primary, textDecorationLine: 'underline', fontWeight: '600' },
});
