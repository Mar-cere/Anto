import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

/**
 * Lista compacta de beneficios / características (onboarding).
 */
export default function OnboardingBenefitList({ items = [], heading }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          width: '100%',
          marginTop: 16,
          gap: 10,
        },
        heading: {
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          color: colors.textSecondary,
          marginBottom: 2,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 14,
          backgroundColor: colors.accentLineSoft,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        iconWrap: {
          width: 28,
          height: 28,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.glassFillStrong ?? colors.glassFill,
        },
        text: {
          flex: 1,
          fontSize: 14,
          lineHeight: 20,
          color: colors.text,
          fontWeight: '500',
        },
      }),
    [colors],
  );

  const icons = ['message-text-outline', 'brain', 'chart-timeline-variant'];

  if (!items.length) return null;

  return (
    <View style={styles.wrap}>
      {heading ? <Text style={styles.heading}>{heading}</Text> : null}
      {items.map((line, index) => (
        <View key={`${index}-${line}`} style={styles.row}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name={icons[index % icons.length]}
              size={16}
              color={colors.primary}
            />
          </View>
          <Text style={styles.text}>{line}</Text>
        </View>
      ))}
    </View>
  );
}
