import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SPACING } from '../../constants/ui';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import SheetBrandGradient from '../common/SheetBrandGradient';

const ICON_BY_VARIANT = {
  error: 'cloud-off-outline',
  empty: 'graph-outline',
};

export default function InterventionGraphStatePanel({
  variant = 'empty',
  title,
  body,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}) {
  const { colors, resolvedScheme } = useTheme();
  const dark = resolvedScheme === 'dark';
  const isLoading = variant === 'loading';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          marginTop: 8,
          marginBottom: 12,
        },
        card: {
          borderRadius: 22,
          overflow: 'hidden',
          borderWidth: dark ? StyleSheet.hairlineWidth : 1,
          borderColor: dark ? colors.glassOutline : colors.border,
          backgroundColor: dark ? colors.chromeCard : colors.surface,
        },
        inner: {
          paddingVertical: SPACING.HERO_INSET,
          paddingHorizontal: SPACING.HERO_INSET,
          alignItems: 'center',
        },
        iconWrap: {
          width: 56,
          height: 56,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.accentLineSoft,
          marginBottom: 14,
        },
        title: {
          fontSize: 18,
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
          marginBottom: 18,
        },
        primaryBtn: {
          width: '100%',
          maxWidth: 280,
          paddingVertical: SPACING.CHIP_INSET,
          borderRadius: 999,
          backgroundColor: colors.primary,
          alignItems: 'center',
          marginBottom: 10,
        },
        primaryText: {
          color: colors.textOnPrimary,
          fontWeight: '700',
          fontSize: 15,
        },
        secondaryBtn: {
          width: '100%',
          maxWidth: 280,
          paddingVertical: SPACING.CHIP_INSET_COMPACT,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.accentLineSoft,
          alignItems: 'center',
        },
        secondaryText: {
          color: colors.primary,
          fontWeight: '600',
          fontSize: 15,
        },
      }),
    [colors, dark],
  );

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <View style={styles.card}>
        <SheetBrandGradient
          topColor={dark ? 'rgba(30, 131, 211, 0.14)' : 'rgba(232, 237, 248, 0.95)'}
          bottomColor={dark ? colors.chromeCard : colors.surface}
        />
        <View style={styles.inner}>
          <View style={styles.iconWrap}>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <MaterialCommunityIcons
                name={ICON_BY_VARIANT[variant] || 'graph-outline'}
                size={28}
                color={variant === 'error' ? colors.error : colors.primary}
              />
            )}
          </View>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {body ? <Text style={styles.body}>{body}</Text> : null}
          {primaryLabel && onPrimary ? (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                onPrimary();
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={primaryLabel}
            >
              <Text style={styles.primaryText}>{primaryLabel}</Text>
            </TouchableOpacity>
          ) : null}
          {secondaryLabel && onSecondary ? (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                onSecondary();
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={secondaryLabel}
            >
              <Text style={styles.secondaryText}>{secondaryLabel}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}
