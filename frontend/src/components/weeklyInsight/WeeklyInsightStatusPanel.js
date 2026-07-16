/**
 * Estado calmado del informe (suscripción, error recuperable o vacío).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING } from '../../constants/ui';

/**
 * @param {{
 *   icon: string,
 *   title: string,
 *   body: string,
 *   ctaLabel?: string|null,
 *   onPressCta?: (() => void)|null,
 *   secondaryCtaLabel?: string|null,
 *   onPressSecondaryCta?: (() => void)|null,
 * }} props
 */
export default function WeeklyInsightStatusPanel({
  icon,
  title,
  body,
  ctaLabel = null,
  onPressCta = null,
  secondaryCtaLabel = null,
  onPressSecondaryCta = null,
}) {
  const { colors, resolvedScheme } = useTheme();
  const dark = resolvedScheme === 'dark';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 40,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          minHeight: 280,
        },
        iconWrap: {
          width: 72,
          height: 72,
          borderRadius: 36,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 18,
          backgroundColor: dark ? colors.glassFillStrong : colors.accentLineSoft,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: dark ? colors.glassOutline : colors.border,
        },
        title: {
          fontSize: 20,
          lineHeight: 26,
          fontWeight: '700',
          color: colors.text,
          textAlign: 'center',
          marginBottom: 8,
        },
        body: {
          fontSize: 15,
          lineHeight: 22,
          color: colors.textSecondary,
          textAlign: 'center',
          maxWidth: 320,
          marginBottom: 22,
        },
        cta: {
          alignSelf: 'center',
          paddingHorizontal: 22,
          paddingVertical: 12,
          borderRadius: 12,
          backgroundColor: colors.primary,
          marginBottom: 10,
        },
        ctaText: {
          color: colors.textOnPrimary,
          fontWeight: '600',
          fontSize: 15,
        },
        secondaryCta: {
          alignSelf: 'center',
          paddingHorizontal: 16,
          paddingVertical: 10,
        },
        secondaryCtaText: {
          color: colors.primary,
          fontWeight: '600',
          fontSize: 14,
        },
      }),
    [colors, dark],
  );

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={icon} size={32} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {ctaLabel && onPressCta ? (
        <TouchableOpacity
          style={styles.cta}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            onPressCta();
          }}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
        >
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </TouchableOpacity>
      ) : null}
      {secondaryCtaLabel && onPressSecondaryCta ? (
        <TouchableOpacity
          style={styles.secondaryCta}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            onPressSecondaryCta();
          }}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={secondaryCtaLabel}
        >
          <Text style={styles.secondaryCtaText}>{secondaryCtaLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
