import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { SPACING } from '../../constants/ui';
import { useTheme } from '../../context/ThemeContext';
import { computePaywallPlanPricing } from '../../utils/paywallPlanPricing';

function PaywallFeaturedPlanCard({
  plan,
  monthlyPlan,
  texts,
  selected,
  disabled,
  isCurrentPlan,
  onSelect,
}) {
  const { colors, resolvedScheme } = useTheme();
  const pricing = useMemo(
    () => computePaywallPlanPricing(plan, monthlyPlan),
    [plan, monthlyPlan],
  );
  const durationLabel = texts.PAYWALL_DURATION_YEAR || plan.name;
  const isSelected = Boolean(selected);
  const isDisabled = Boolean(disabled);

  const dark = resolvedScheme === 'dark';
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: 20,
          overflow: 'hidden',
          marginBottom: 14,
          borderWidth: isSelected ? 2 : StyleSheet.hairlineWidth,
          borderColor: isSelected ? colors.primaryBright || colors.primary : colors.border,
          opacity: isDisabled ? 0.55 : 1,
        },
        inner: {
          padding: SPACING.HERO_INSET,
          minHeight: 132,
        },
        badge: {
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: SPACING.CHIP_INSET_COMPACT,
          paddingVertical: SPACING.xs,
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.16)',
          marginBottom: 12,
        },
        badgeText: {
          color: colors.white,
          fontSize: 12,
          fontWeight: '700',
        },
        row: {
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: SPACING.CHIP_INSET,
        },
        duration: {
          color: colors.white,
          fontSize: 22,
          fontWeight: '700',
          marginBottom: 4,
        },
        total: {
          color: 'rgba(255,255,255,0.82)',
          fontSize: 14,
        },
        perMonth: {
          color: colors.white,
          fontSize: 28,
          fontWeight: '800',
          letterSpacing: -0.5,
        },
        perMonthSuffix: {
          color: 'rgba(255,255,255,0.88)',
          fontSize: 15,
          fontWeight: '600',
        },
        savings: {
          marginTop: 6,
          color: colors.primaryBright || '#7AE8FF',
          fontSize: 13,
          fontWeight: '600',
          textAlign: 'right',
        },
        currentPill: {
          marginTop: 10,
          alignSelf: 'flex-start',
          paddingHorizontal: SPACING.CHIP_INSET_COMPACT,
          paddingVertical: SPACING.xs,
          borderRadius: 999,
          backgroundColor: 'rgba(76, 175, 80, 0.25)',
        },
        currentText: {
          color: colors.white,
          fontSize: 12,
          fontWeight: '700',
        },
      }),
    [colors, isDisabled, isSelected],
  );

  const handlePress = () => {
    if (isDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSelect?.(plan);
  };

  const vsMonthly =
    pricing.monthlyReference > 0 && pricing.months > 1
      ? texts.PAYWALL_VS_MONTHLY.replace('{price}', pricing.formattedMonthlyReference)
      : null;

  return (
    <Pressable
      style={styles.card}
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected, disabled: isDisabled }}
    >
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="featuredPlanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={dark ? '#1A4FA8' : colors.primary} />
              <Stop offset="100%" stopColor={dark ? '#0D2A5C' : '#24214F'} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#featuredPlanGrad)" />
        </Svg>
      </View>
      <View style={styles.inner}>
        <View style={styles.badge}>
          <MaterialCommunityIcons name="star-four-points" size={12} color={colors.white} />
          <Text style={styles.badgeText}>{texts.PAYWALL_BEST_VALUE}</Text>
        </View>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.duration}>{texts.PAYWALL_DURATION_YEAR || durationLabel}</Text>
            <Text style={styles.total}>{pricing.formattedTotal}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.perMonth}>
              {pricing.formattedPerMonth}
              <Text style={styles.perMonthSuffix}>{texts.PAYWALL_PER_MONTH}</Text>
            </Text>
            {vsMonthly ? <Text style={styles.savings}>{vsMonthly}</Text> : null}
            {!vsMonthly && pricing.percentSave > 0 ? (
              <Text style={styles.savings}>
                {texts.PAYWALL_SAVE_PERCENT.replace('{percent}', String(pricing.percentSave))}
              </Text>
            ) : null}
          </View>
        </View>
        {isCurrentPlan ? (
          <View style={styles.currentPill}>
            <Text style={styles.currentText}>{texts.PLAN_CARD_CURRENT_PLAN}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export default memo(PaywallFeaturedPlanCard);
