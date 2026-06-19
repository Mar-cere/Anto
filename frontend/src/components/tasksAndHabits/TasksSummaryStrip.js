import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';

export default function TasksSummaryStrip({
  todayCount = 0,
  upcomingCount = 0,
  attentionCount = 0,
}) {
  const { colors } = useTheme();
  const T = useSectionTranslations('TASKS_AND_HABITS');

  const tiles = useMemo(
    () => [
      {
        key: 'today',
        value: todayCount,
        label: T.SUMMARY_TODAY || 'para hoy',
        tone: 'default',
      },
      {
        key: 'upcoming',
        value: upcomingCount,
        label: T.SUMMARY_UPCOMING || 'próximas',
        tone: 'default',
      },
      {
        key: 'attention',
        value: attentionCount,
        label: T.SUMMARY_ATTENTION || 'requieren atención',
        tone: 'attention',
      },
    ],
    [T, todayCount, upcomingCount, attentionCount],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          gap: 8,
          marginBottom: 14,
        },
        tile: {
          flex: 1,
          borderRadius: 14,
          paddingVertical: 12,
          paddingHorizontal: 10,
          backgroundColor: colors.chromeCard,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.chromeCardBorder,
          alignItems: 'center',
        },
        tileAttention: {
          borderColor: 'rgba(251, 146, 60, 0.45)',
          backgroundColor: 'rgba(251, 146, 60, 0.08)',
        },
        value: {
          fontSize: 22,
          fontWeight: '700',
          color: colors.text,
          letterSpacing: -0.4,
        },
        valueAttention: {
          color: colors.warning,
        },
        label: {
          marginTop: 2,
          fontSize: 11,
          lineHeight: 14,
          textAlign: 'center',
          color: colors.textSecondary,
          fontWeight: '500',
        },
        labelAttention: {
          color: colors.warning,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.row} accessibilityRole="summary">
      {tiles.map((tile) => {
        const attention = tile.tone === 'attention';
        return (
          <View
            key={tile.key}
            style={[styles.tile, attention && styles.tileAttention]}
          >
            <Text style={[styles.value, attention && styles.valueAttention]}>
              {tile.value}
            </Text>
            <Text style={[styles.label, attention && styles.labelAttention]}>
              {tile.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
