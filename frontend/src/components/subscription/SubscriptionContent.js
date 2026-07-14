/**
 * Paywall emocional: memoria del día, plan anual destacado y grid compacto.
 * La lógica de compra sigue en useSubscriptionScreen (sin cambios de backend).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SubscriptionStatus from '../payments/SubscriptionStatus';
import storeKitService from '../../services/storeKitService';
import { usePaywallDayMemory } from '../../hooks/usePaywallDayMemory';
import {
  LEGAL_URLS,
  useSubscriptionTexts,
} from '../../screens/subscription/subscriptionScreenConstants';
import SubscriptionLegalSection from './SubscriptionLegalSection';
import PaywallBrandOrb from './PaywallBrandOrb';
import PaywallMemoryCard from './PaywallMemoryCard';
import PaywallFeaturedPlanCard from './PaywallFeaturedPlanCard';
import PaywallCompactPlanCard from './PaywallCompactPlanCard';
import { useTheme } from '../../context/ThemeContext';
import { SPACING } from '../../constants/ui';
import { subscriptionLooksCurrentlyUsable } from '../../utils/subscriptionAccess';

const GRID_PLAN_ORDER = ['quarterly', 'semestral', 'monthly'];

export default function SubscriptionContent({
  plans,
  subscriptionStatus,
  selectedPlan,
  subscribing,
  onSubscribe,
  onCancelSubscription,
  onRestorePurchases,
}) {
  const TEXTS = useSubscriptionTexts();
  const insets = useSafeAreaInsets();
  const { colors, resolvedScheme } = useTheme();
  const { loading: memoryLoading, stats } = usePaywallDayMemory();
  const hasActiveSubscription = subscriptionLooksCurrentlyUsable(subscriptionStatus);
  const [chosenPlanId, setChosenPlanId] = useState('yearly');

  const planById = useMemo(() => {
    const map = {};
    (plans || []).forEach((p) => {
      if (p?.id) map[p.id] = p;
    });
    return map;
  }, [plans]);

  const yearlyPlan = planById.yearly;
  const monthlyPlan = planById.monthly;
  const gridPlans = GRID_PLAN_ORDER.map((id) => planById[id]).filter(Boolean);

  useEffect(() => {
    if (yearlyPlan?.id) setChosenPlanId('yearly');
    else if (plans?.[0]?.id) setChosenPlanId(plans[0].id);
  }, [yearlyPlan?.id, plans]);

  const storeKitRestoreEnabled = React.useMemo(() => {
    if (Platform.OS !== 'ios') return false;
    try {
      return storeKitService.isAvailable();
    } catch {
      return false;
    }
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scrollView: { flex: 1 },
        scrollContent: {
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingTop: 8,
        },
        hero: {
          alignItems: 'center',
          marginBottom: 8,
        },
        headline: {
          fontSize: 26,
          fontWeight: '800',
          color: colors.text,
          textAlign: 'center',
          letterSpacing: -0.4,
          lineHeight: 32,
          marginBottom: 8,
        },
        subheadline: {
          fontSize: 15,
          lineHeight: 22,
          color: colors.textSecondary,
          textAlign: 'center',
          maxWidth: 320,
          marginBottom: 4,
        },
        sectionShell: {
          padding: 14,
          marginBottom: 18,
          borderRadius: 18,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          backgroundColor: colors.settingsSectionSurface,
          shadowColor: colors.glassShadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: resolvedScheme === 'dark' ? 0.35 : 0.1,
          shadowRadius: 10,
          elevation: resolvedScheme === 'dark' ? 4 : 2,
        },
        sectionEyebrow: {
          fontSize: 12,
          fontWeight: '800',
          letterSpacing: 1.1,
          color: colors.textSecondary,
          marginBottom: 12,
          textTransform: 'uppercase',
        },
        planGrid: {
          flexDirection: 'row',
          gap: 8,
          marginBottom: 18,
        },
        cta: {
          backgroundColor: colors.primary,
          borderRadius: 16,
          paddingVertical: 16,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          marginBottom: 12,
        },
        ctaDisabled: {
          opacity: 0.45,
        },
        ctaText: {
          color: colors.textOnPrimary,
          fontSize: 17,
          fontWeight: '700',
        },
        finePrint: {
          fontSize: 12,
          lineHeight: 18,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 16,
        },
        benefits: {
          gap: 10,
          marginBottom: 18,
        },
        benefitRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        },
        benefitText: {
          flex: 1,
          fontSize: 14,
          color: colors.text,
          lineHeight: 20,
        },
        agreementWrap: {
          alignItems: 'center',
          marginBottom: 14,
        },
        agreementIntro: {
          fontSize: 12,
          color: colors.textSecondary,
          lineHeight: 18,
          textAlign: 'center',
          marginBottom: 4,
        },
        agreementLinksRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
        },
        agreementTextInline: {
          fontSize: 12,
          color: colors.textSecondary,
          lineHeight: 18,
        },
        agreementLink: {
          fontSize: 12,
          color: colors.primary,
          textDecorationLine: 'underline',
          fontWeight: '600',
          lineHeight: 18,
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
        cancelButtonText: { color: colors.error, fontSize: 16, fontWeight: '600' },
        restoreButton: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 4,
          marginBottom: 8,
          paddingVertical: 12,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
        },
        restoreButtonText: {
          color: colors.textSecondary,
          fontSize: 14,
          fontWeight: '600',
          marginLeft: 8,
          textDecorationLine: 'underline',
        },
        emptyContainer: { padding: 32, alignItems: 'center' },
        emptyText: { color: colors.textSecondary, fontSize: 16, textAlign: 'center' },
      }),
    [colors, resolvedScheme, subscribing],
  );

  const resolvePlanDisabled = (plan) => {
    if (!plan?.id) return true;
    const isCurrentPlan = Boolean(
      subscriptionStatus?.plan &&
        plan.id === subscriptionStatus.plan &&
        hasActiveSubscription,
    );
    return Boolean(subscribing) || isCurrentPlan;
  };

  const chosenPlan = planById[chosenPlanId];
  const ctaDisabled = Boolean(
    subscribing || !chosenPlanId || !chosenPlan || resolvePlanDisabled(chosenPlan),
  );

  const handleSelectPlan = (plan) => {
    if (!plan?.id || resolvePlanDisabled(plan)) return;
    setChosenPlanId(plan.id);
  };

  const handleContinue = () => {
    const plan = planById[chosenPlanId];
    if (!plan || resolvePlanDisabled(plan)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onSubscribe?.(plan);
  };

  const compactBadgeFor = (planId) => {
    if (planId === 'quarterly') return TEXTS.PAYWALL_BADGE_POPULAR;
    if (planId === 'semestral' && monthlyPlan) {
      const sem = planById.semestral;
      if (sem?.amount && monthlyPlan.amount) {
        const pct = Math.max(
          0,
          Math.round((1 - sem.amount / 6 / monthlyPlan.amount) * 100),
        );
        if (pct > 0) {
          return TEXTS.PAYWALL_SAVE_PERCENT.replace('{percent}', String(pct));
        }
      }
    }
    return null;
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: insets.bottom + SPACING.FLOATING_NAV_SCROLL_BOTTOM_EXTRA },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <PaywallBrandOrb />
        <Text style={styles.headline}>{TEXTS.PAYWALL_HEADLINE}</Text>
        <Text style={styles.subheadline}>{TEXTS.PAYWALL_SUBHEADLINE}</Text>
      </View>

      <PaywallMemoryCard stats={stats} loading={memoryLoading} texts={TEXTS} />

      {subscriptionStatus?.hasSubscription && subscriptionStatus?.status ? (
        <View style={styles.sectionShell}>
          <Text style={styles.sectionEyebrow}>{TEXTS.CURRENT_SUBSCRIPTION}</Text>
          <SubscriptionStatus
            status={subscriptionStatus.status || 'free'}
            plan={subscriptionStatus.plan || null}
            daysRemaining={subscriptionStatus.daysRemaining ?? null}
            trialEndDate={subscriptionStatus.trialEndDate ?? null}
            subscriptionEndDate={subscriptionStatus.subscriptionEndDate ?? null}
            isActive={subscriptionStatus.isActive}
          />
          {hasActiveSubscription ? (
            <TouchableOpacity style={styles.cancelButton} onPress={onCancelSubscription}>
              <MaterialCommunityIcons name="cancel" size={20} color={colors.error} />
              <Text style={styles.cancelButtonText}>{TEXTS.CANCEL_SUBSCRIPTION}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {!yearlyPlan && (!plans || plans.length === 0) ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{TEXTS.NO_PLANS}</Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionEyebrow}>{TEXTS.PAYWALL_CHOOSE_PLAN}</Text>

          {yearlyPlan ? (
            <PaywallFeaturedPlanCard
              plan={yearlyPlan}
              monthlyPlan={monthlyPlan}
              texts={TEXTS}
              selected={chosenPlanId === yearlyPlan.id}
              disabled={resolvePlanDisabled(yearlyPlan)}
              isCurrentPlan={
                subscriptionStatus?.plan === yearlyPlan.id && hasActiveSubscription
              }
              onSelect={handleSelectPlan}
            />
          ) : null}

          {gridPlans.length > 0 ? (
            <View style={styles.planGrid}>
              {gridPlans.map((plan) => (
                <PaywallCompactPlanCard
                  key={plan.id}
                  plan={plan}
                  monthlyPlan={monthlyPlan}
                  texts={TEXTS}
                  selected={chosenPlanId === plan.id}
                  disabled={resolvePlanDisabled(plan)}
                  isCurrentPlan={
                    subscriptionStatus?.plan === plan.id && hasActiveSubscription
                  }
                  badge={compactBadgeFor(plan.id)}
                  onSelect={handleSelectPlan}
                />
              ))}
            </View>
          ) : null}

          <View style={styles.agreementWrap}>
            <Text style={styles.agreementIntro}>{TEXTS.SUBSCRIBE_AGREEMENT}</Text>
            <View style={styles.agreementLinksRow}>
              <Text
                style={styles.agreementLink}
                onPress={() => Linking.openURL(LEGAL_URLS.TERMS_EULA)}
              >
                {TEXTS.SUBSCRIBE_AGREEMENT_TERMS}
              </Text>
              <Text style={styles.agreementTextInline}>{TEXTS.SUBSCRIBE_AGREEMENT_AND}</Text>
              <Text
                style={styles.agreementLink}
                onPress={() => Linking.openURL(LEGAL_URLS.PRIVACY)}
              >
                {TEXTS.SUBSCRIBE_AGREEMENT_PRIVACY}
              </Text>
              <Text style={styles.agreementTextInline}>{TEXTS.SUBSCRIBE_AGREEMENT_END}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.cta, ctaDisabled && styles.ctaDisabled]}
            onPress={handleContinue}
            disabled={ctaDisabled}
            accessibilityRole="button"
            accessibilityState={{ disabled: ctaDisabled }}
          >
            {subscribing && selectedPlan === chosenPlanId ? (
              <ActivityIndicator color={colors.textOnPrimary} />
            ) : (
              <>
                <Text style={styles.ctaText}>{TEXTS.PAYWALL_CTA}</Text>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={20}
                  color={colors.textOnPrimary}
                />
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.finePrint}>
            {Platform.OS === 'ios' ? TEXTS.INFO_TEXT_IOS : TEXTS.INFO_TEXT_ANDROID}
          </Text>

          <View style={styles.benefits}>
            {[TEXTS.PAYWALL_BENEFIT_1, TEXTS.PAYWALL_BENEFIT_2, TEXTS.PAYWALL_BENEFIT_3].map(
              (line) => (
                <View key={line} style={styles.benefitRow}>
                  <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
                  <Text style={styles.benefitText}>{line}</Text>
                </View>
              ),
            )}
          </View>

          {storeKitRestoreEnabled ? (
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={onRestorePurchases}
              disabled={subscribing}
            >
              <MaterialCommunityIcons name="restore" size={18} color={colors.textSecondary} />
              <Text style={styles.restoreButtonText}>
                {subscribing ? TEXTS.RESTORING_PURCHASES : TEXTS.RESTORE_PURCHASES}
              </Text>
            </TouchableOpacity>
          ) : null}
        </>
      )}

      <View style={styles.sectionShell}>
        <SubscriptionLegalSection compact inShell />
      </View>
    </ScrollView>
  );
}
