import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import SheetBrandGradient from '../common/SheetBrandGradient';

export default function WeeklyInsightHero({ periodLabel, headline, body }) {
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
          borderColor: dark ? colors.glassOutline : colors.border,
        },
        inner: {
          padding: 18,
        },
        period: {
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.8,
          color: colors.textMuted ?? colors.textSecondary,
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
        topColor={dark ? 'rgba(30, 131, 211, 0.16)' : 'rgba(232, 237, 248, 0.95)'}
        bottomColor={dark ? colors.chromeCard : colors.surface}
      />
      <View style={styles.inner}>
        {periodLabel ? <Text style={styles.period}>{periodLabel}</Text> : null}
        <Text style={styles.headline}>{headline}</Text>
        {body ? <Text style={styles.body}>{body}</Text> : null}
      </View>
    </View>
  );
}
