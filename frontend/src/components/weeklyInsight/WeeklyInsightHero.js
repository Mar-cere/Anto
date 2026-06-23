import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { resolveInsightsHeroGradient } from '../../utils/insightsHeroGradient';
import SheetBrandGradient from '../common/SheetBrandGradient';

export default function WeeklyInsightHero({ periodLabel, headline, body }) {
  const { colors, resolvedScheme } = useTheme();
  const dark = resolvedScheme === 'dark';
  const heroGradient = useMemo(
    () => resolveInsightsHeroGradient(colors, dark),
    [colors, dark],
  );
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: 22,
          overflow: 'hidden',
          marginBottom: 16,
          borderWidth: dark ? StyleSheet.hairlineWidth : 1,
          borderColor: dark ? colors.glassOutline : colors.border,
        },
        inner: {
          padding: 18,
        },
        period: {
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.8,
          color: colors.textSecondary,
          marginBottom: 8,
        },
        headline: {
          fontSize: 24,
          lineHeight: 30,
          fontWeight: '700',
          color: colors.text,
        },
        body: {
          marginTop: 10,
          fontSize: 15,
          lineHeight: 22,
          color: colors.textSecondary,
        },
      }),
    [colors, dark],
  );

  return (
    <View style={styles.card} accessibilityRole="header">
      <SheetBrandGradient
        topColor={heroGradient.top}
        bottomColor={heroGradient.bottom}
      />
      <View style={styles.inner}>
        {periodLabel ? <Text style={styles.period}>{periodLabel}</Text> : null}
        <Text style={styles.headline}>{headline}</Text>
        {body ? <Text style={styles.body}>{body}</Text> : null}
      </View>
    </View>
  );
}
