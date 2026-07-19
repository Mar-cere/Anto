import React, { useMemo } from 'react';
import { SPACING } from '../../constants/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';

const FILTERS = [
  { key: 'daily', labelKey: 'FILTER_DAILY' },
  { key: 'weekly', labelKey: 'FILTER_WEEKLY' },
  { key: 'all', labelKey: 'FILTER_ALL' },
];

export default function HabitsFrequencyFilters({ value = 'daily', onChange }) {
  const { colors } = useTheme();
  const T = useSectionTranslations('TASKS_AND_HABITS');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          gap: SPACING.sm,
          marginBottom: 12,
        },
        pill: {
          paddingVertical: SPACING.CHIP_INSET_COMPACT,
          paddingHorizontal: SPACING.CHIP_INSET,
          borderRadius: 999,
          backgroundColor: colors.glassFill,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.chromeHeaderBorder,
        },
        pillActive: {
          backgroundColor: colors.primary,
          borderColor: colors.accentLine,
        },
        pillText: {
          color: colors.text,
          fontSize: 13,
          fontWeight: '500',
        },
        pillTextActive: {
          color: colors.textOnPrimary,
          fontWeight: '600',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.row}>
      {FILTERS.map((filter) => {
        const active = value === filter.key;
        const label = T[filter.labelKey] || filter.key;
        return (
          <Pressable
            key={filter.key}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              onChange?.(filter.key);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
