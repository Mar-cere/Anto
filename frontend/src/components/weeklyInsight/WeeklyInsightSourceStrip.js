import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function WeeklyInsightSourceStrip({ chips }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 14,
        },
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingVertical: 7,
          paddingHorizontal: 11,
          borderRadius: 999,
          backgroundColor: colors.accentLineSoft,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        label: {
          fontSize: 12,
          fontWeight: '600',
          color: colors.textSecondary,
        },
      }),
    [colors],
  );

  if (!chips?.length) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {chips.map((chip) => (
        <View key={chip.key} style={styles.chip} accessibilityRole="text">
          <MaterialCommunityIcons name={chip.icon} size={14} color={colors.primary} />
          <Text style={styles.label}>{chip.label}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
