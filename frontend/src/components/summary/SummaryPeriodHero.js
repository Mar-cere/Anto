import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import SheetBrandGradient from '../common/SheetBrandGradient';

export default function SummaryPeriodHero({ periodTitle, intro, pulseLine, pulseLabel, pulseEmpty }) {
  const { colors, resolvedScheme } = useTheme();
  const dark = resolvedScheme === 'dark';
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: 22,
          overflow: 'hidden',
          marginBottom: 16,
          borderWidth: dark ? StyleSheet.hairlineWidth : 1,
          borderColor: dark ? colors.glassOutline : 'rgba(36, 35, 79, 0.1)',
          backgroundColor: dark ? colors.chromeCard : colors.surface,
        },
        inner: {
          padding: 18,
        },
        period: {
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: colors.textMuted ?? colors.textSecondary,
          marginBottom: 6,
        },
        title: {
          fontSize: 20,
          fontWeight: '600',
          color: colors.text,
          lineHeight: 26,
          marginBottom: intro ? 8 : 0,
        },
        intro: {
          fontSize: 15,
          lineHeight: 22,
          color: colors.textSecondary,
        },
        pulseRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginTop: 14,
          paddingTop: 14,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        },
        pulseChip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 999,
          backgroundColor: colors.accentLineSoft,
        },
        pulseLabel: {
          fontSize: 12,
          fontWeight: '600',
          color: colors.textSecondary,
        },
        pulseValue: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.text,
        },
        pulseEmpty: {
          fontSize: 13,
          lineHeight: 18,
          color: colors.textSecondary,
          flex: 1,
        },
      }),
    [colors, dark],
  );

  return (
    <View style={styles.card} accessibilityRole="summary">
      <SheetBrandGradient
        topColor={dark ? 'rgba(30, 131, 211, 0.18)' : 'rgba(232, 237, 248, 0.95)'}
        bottomColor={dark ? colors.chromeCard : colors.surface}
      />
      <View style={styles.inner}>
        <Text style={styles.period}>{periodTitle}</Text>
        {intro ? <Text style={styles.intro}>{intro}</Text> : null}
        <View style={styles.pulseRow}>
          <Text style={styles.pulseLabel}>{pulseLabel}</Text>
          {pulseLine ? (
            <View style={styles.pulseChip}>
              <MaterialCommunityIcons name="heart-pulse" size={14} color={colors.primary} />
              <Text style={styles.pulseValue}>{pulseLine}</Text>
            </View>
          ) : (
            <Text style={styles.pulseEmpty}>{pulseEmpty}</Text>
          )}
        </View>
      </View>
    </View>
  );
}
