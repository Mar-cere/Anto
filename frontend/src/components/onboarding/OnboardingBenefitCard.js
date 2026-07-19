import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SPACING } from '../../constants/ui';
import { useTheme } from '../../context/ThemeContext';
import { resolveOnboardingBrandAccent } from '../../utils/onboardingBrand';

/**
 * Tarjeta única de beneficio por paso (punto medio con mockup).
 */
export default function OnboardingBenefitCard({ text }) {
  const { colors, resolvedScheme } = useTheme();
  const dark = resolvedScheme === 'dark';
  const accent = resolveOnboardingBrandAccent(colors);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          width: '100%',
          marginTop: 18,
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: SPACING.CHIP_INSET,
          paddingVertical: SPACING.CARD_INNER_INSET,
          paddingHorizontal: SPACING.CARD_INNER_INSET,
          borderRadius: 16,
          backgroundColor: dark
            ? 'rgba(255, 255, 255, 0.06)'
            : colors.accentLineSoft,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: dark ? 'rgba(255, 255, 255, 0.1)' : colors.accentLine,
        },
        bullet: {
          width: 26,
          height: 26,
          borderRadius: 13,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: dark
            ? 'rgba(68, 215, 251, 0.14)'
            : colors.glassFillStrong ?? colors.glassFill,
          marginTop: 1,
        },
        text: {
          flex: 1,
          fontSize: 14,
          lineHeight: 21,
          color: colors.text,
          fontWeight: '500',
        },
      }),
    [colors, dark],
  );

  if (!text) return null;

  return (
    <View style={styles.card}>
      <View style={styles.bullet}>
        <MaterialCommunityIcons name="check" size={14} color={accent} />
      </View>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}
