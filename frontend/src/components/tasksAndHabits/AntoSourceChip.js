import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';

const DEFAULT_LABEL = 'Anto';

export default function AntoSourceChip({ compact = false }) {
  const { colors } = useTheme();
  const T = useSectionTranslations('TASKS_AND_HABITS');
  const label = T.SOURCE_ANTO || DEFAULT_LABEL;
  const styles = useMemo(
    () =>
      StyleSheet.create({
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: compact ? 7 : 8,
          paddingVertical: compact ? 2 : 3,
          borderRadius: 999,
          backgroundColor: colors.accentLineSoft,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.accentLine,
        },
        diamond: {
          color: colors.primary,
          fontSize: compact ? 9 : 10,
          fontWeight: '700',
        },
        label: {
          color: colors.primary,
          fontSize: compact ? 10 : 11,
          fontWeight: '600',
        },
      }),
    [colors, compact],
  );

  return (
    <View style={styles.chip} accessibilityRole="text" accessibilityLabel={label}>
      <Text style={styles.diamond}>◆</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}
