import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SPACING } from '../../constants/ui';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { getInsightTypeVisual } from '../../utils/weeklyInsightUtils';

function resolveTint(colors, tintKey) {
  switch (tintKey) {
    case 'warm':
      return { bg: colors.warmTintSoft ?? colors.accentLineSoft, fg: colors.warmAccent ?? colors.primary };
    case 'calm':
      return { bg: colors.calmTintSoft ?? colors.accentLineSoft, fg: colors.calmAccent ?? colors.primary };
    case 'neutral':
      return { bg: colors.glassFill ?? colors.accentLineSoft, fg: colors.textSecondary };
    default:
      return { bg: colors.accentLineSoft, fg: colors.primary };
  }
}

export default function WeeklyInsightCard({ row, ctaLabel, onPressCta }) {
  const { colors } = useTheme();
  const visual = getInsightTypeVisual(row.type);
  const tint = resolveTint(colors, visual.tint);
  const strengthPct = typeof row.strength === 'number' ? Math.round(row.strength * 100) : null;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: 18,
          padding: SPACING.HERO_INSET_COMPACT,
          marginBottom: 12,
          backgroundColor: colors.chromeCard ?? colors.cardBackground,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        topRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: SPACING.CHIP_INSET,
        },
        iconWrap: {
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: tint.bg,
        },
        copy: {
          flex: 1,
        },
        labelRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACING.sm,
          marginBottom: 4,
        },
        label: {
          flex: 1,
          fontSize: 13,
          fontWeight: '700',
          color: colors.primary,
        },
        strength: {
          fontSize: 11,
          fontWeight: '700',
          color: colors.textSecondary,
          backgroundColor: colors.glassFill,
          paddingHorizontal: SPACING.sm,
          paddingVertical: 3,
          borderRadius: 999,
          overflow: 'hidden',
        },
        quote: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.text,
          marginBottom: 6,
        },
        detail: {
          fontSize: 15,
          lineHeight: 22,
          color: colors.textSecondary,
        },
        cta: {
          marginTop: 12,
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingVertical: SPACING.sm,
          paddingHorizontal: SPACING.CHIP_INSET_COMPACT,
          borderRadius: 999,
          backgroundColor: colors.accentLineSoft,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        ctaText: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.primary,
        },
      }),
    [colors, tint.bg],
  );

  const showQuote = row.quote && row.type === 'concept_intervention';

  return (
    <View style={styles.card} accessibilityRole="text">
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name={visual.icon} size={20} color={tint.fg} />
        </View>
        <View style={styles.copy}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>{row.label}</Text>
            {strengthPct != null ? <Text style={styles.strength}>{strengthPct}%</Text> : null}
          </View>
          {showQuote ? <Text style={styles.quote}>«{row.quote}»</Text> : null}
          <Text style={styles.detail}>{row.detail}</Text>
          {onPressCta ? (
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
              <MaterialCommunityIcons name="chevron-right" size={16} color={colors.primary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}
