import * as Haptics from 'expo-haptics';
import React, { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import {
  PLAN_DURATION_LABEL_KEYS,
  computePaywallPlanPricing,
} from '../../utils/paywallPlanPricing';

function PaywallCompactPlanCard({
  plan,
  monthlyPlan,
  texts,
  selected,
  disabled,
  isCurrentPlan,
  badge,
  onSelect,
}) {
  const { colors, resolvedScheme } = useTheme();
  const pricing = useMemo(
    () => computePaywallPlanPricing(plan, monthlyPlan),
    [plan, monthlyPlan],
  );
  const labelKey = PLAN_DURATION_LABEL_KEYS[plan.id];
  const durationLabel = (labelKey && texts[labelKey]) || plan.name;
  const isSelected = Boolean(selected);
  const isDisabled = Boolean(disabled);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          flex: 1,
          minWidth: 0,
          borderRadius: 16,
          paddingVertical: 14,
          paddingHorizontal: 10,
          borderWidth: isSelected ? 2 : StyleSheet.hairlineWidth,
          borderColor: isSelected ? colors.primary : colors.border,
          backgroundColor:
            resolvedScheme === 'dark' ? colors.chromeCard : colors.settingsSectionSurface,
          opacity: isDisabled ? 0.55 : 1,
        },
        duration: {
          fontSize: 11,
          fontWeight: '800',
          letterSpacing: 0.6,
          color: colors.textSecondary,
          marginBottom: 6,
          textTransform: 'uppercase',
        },
        total: {
          fontSize: 16,
          fontWeight: '700',
          color: colors.text,
          marginBottom: 2,
        },
        perMonth: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.text,
        },
        perMonthSuffix: {
          fontSize: 11,
          color: colors.textSecondary,
        },
        badge: {
          marginTop: 8,
          fontSize: 11,
          fontWeight: '700',
          color: colors.success,
        },
        current: {
          marginTop: 8,
          fontSize: 10,
          fontWeight: '700',
          color: colors.success,
        },
      }),
    [colors, resolvedScheme, isSelected, isDisabled],
  );

  const handlePress = () => {
    if (isDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSelect?.(plan);
  };

  const vsMonthly =
    pricing.months > 1 && pricing.monthlyReference > 0
      ? texts.PAYWALL_VS_MONTHLY_SHORT.replace('{price}', pricing.formattedMonthlyReference)
      : null;

  return (
    <Pressable
      style={styles.card}
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected, disabled: isDisabled }}
    >
      <Text style={styles.duration} numberOfLines={1}>
        {durationLabel}
      </Text>
      <Text style={styles.total} numberOfLines={1}>
        {pricing.formattedTotal}
      </Text>
      <Text style={styles.perMonth} numberOfLines={2}>
        {pricing.formattedPerMonth}
        <Text style={styles.perMonthSuffix}>{texts.PAYWALL_PER_MONTH}</Text>
      </Text>
      {badge ? <Text style={styles.badge}>{badge}</Text> : null}
      {!badge && vsMonthly ? <Text style={styles.badge}>{vsMonthly}</Text> : null}
      {isCurrentPlan ? <Text style={styles.current}>{texts.PLAN_CARD_CURRENT_PLAN}</Text> : null}
    </Pressable>
  );
}

export default memo(PaywallCompactPlanCard);
