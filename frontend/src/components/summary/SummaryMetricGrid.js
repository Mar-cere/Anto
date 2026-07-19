import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { SPACING } from '../../constants/ui';
import { SUMMARY_METRIC_DEFS } from '../../utils/summaryScreenUtils';

function resolveMetricTint(colors, tintKey) {
  switch (tintKey) {
    case 'accent':
      return { bg: colors.accentLineSoft, fg: colors.primary };
    case 'warm':
      return { bg: colors.warmTintSoft ?? colors.accentLineSoft, fg: colors.warmAccent ?? colors.primary };
    case 'success':
      return { bg: colors.successSoft ?? 'rgba(46, 125, 50, 0.1)', fg: colors.success ?? colors.primary };
    case 'calm':
      return { bg: colors.calmTintSoft ?? colors.accentLineSoft, fg: colors.calmAccent ?? colors.primary };
    case 'journal':
      return { bg: colors.glassFill ?? colors.accentLineSoft, fg: colors.textSecondary };
    default:
      return { bg: colors.accentLineSoft, fg: colors.primary };
  }
}

function SummaryMetricTile({ icon, value, label, tint, colors }) {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        tile: {
          width: '48%',
          borderRadius: 16,
          paddingVertical: SPACING.CHIP_INSET,
          paddingHorizontal: SPACING.CARD_INNER_INSET,
          marginBottom: 10,
          backgroundColor: tint.bg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.CARD_INNER_INSET,
        },
        iconWrap: {
          width: 36,
          height: 36,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.cardBackground ?? colors.background,
        },
        copy: {
          flex: 1,
        },
        value: {
          fontSize: 22,
          fontWeight: '600',
          color: colors.text,
          letterSpacing: -0.3,
        },
        label: {
          marginTop: 2,
          fontSize: 13,
          fontWeight: '500',
          color: colors.textSecondary,
          lineHeight: 17,
        },
      }),
    [colors, tint.bg],
  );

  return (
    <View style={styles.tile} accessibilityRole="text" accessibilityLabel={`${label}: ${value}`}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name={icon} size={20} color={tint.fg} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.value}>{value}</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
      </View>
    </View>
  );
}

export default function SummaryMetricGrid({ payload, texts, sectionTitle }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        block: {
          marginBottom: 4,
        },
        title: {
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: 0.6,
          color: colors.textMuted ?? colors.textSecondary,
          marginBottom: 10,
          paddingHorizontal: SPACING.xs,
        },
        grid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.block}>
      {sectionTitle ? <Text style={styles.title}>{sectionTitle}</Text> : null}
      <View style={styles.grid}>
        {SUMMARY_METRIC_DEFS.map((def) => {
          const tint = resolveMetricTint(colors, def.tintKey);
          return (
            <SummaryMetricTile
              key={def.key}
              icon={def.icon}
              value={String(def.getValue(payload))}
              label={texts[def.labelKey]}
              tint={tint}
              colors={colors}
            />
          );
        })}
      </View>
    </View>
  );
}
