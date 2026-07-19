import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SPACING } from '../../constants/ui';
import { useTheme } from '../../context/ThemeContext';
import { resolveOnboardingBrandAccent } from '../../utils/onboardingBrand';

/**
 * Bullets del paso actual — llena el slide con contenido útil.
 */
export default function OnboardingStepHighlights({ items = [], heading }) {
  const { colors } = useTheme();
  const accent = resolveOnboardingBrandAccent(colors);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          width: '100%',
          marginTop: 16,
          gap: SPACING.sm,
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
          gap: SPACING.CARD_INNER_INSET,
          paddingVertical: SPACING.CARD_INNER_INSET,
          paddingHorizontal: SPACING.CARD_INNER_INSET,
          borderRadius: 14,
          backgroundColor: colors.glassFillStrong ?? colors.glassFill,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        bullet: {
          width: 22,
          height: 22,
          borderRadius: 11,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.accentLineSoft,
          marginTop: 1,
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

  if (!items.length) return null;

  return (
    <View style={styles.wrap}>
      {heading ? <Text style={styles.heading}>{heading}</Text> : null}
      {items.map((line, index) => (
        <View key={`${index}-${line}`} style={styles.row}>
          <View style={styles.bullet}>
            <MaterialCommunityIcons name="check" size={13} color={accent} />
          </View>
          <Text style={styles.text}>{line}</Text>
        </View>
      ))}
    </View>
  );
}
