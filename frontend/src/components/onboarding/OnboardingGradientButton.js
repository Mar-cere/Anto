import React, { useId, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { resolveOnboardingGradient } from '../../utils/onboardingBrand';

/**
 * CTA con gradiente de marca (mockup) — reutilizable en welcome y pasos.
 */
export default function OnboardingGradientButton({
  label,
  onPress,
  flex = 1,
  showChevron = false,
  disabled = false,
}) {
  const { colors, resolvedScheme } = useTheme();
  const dark = resolvedScheme === 'dark';
  const gradient = useMemo(
    () => resolveOnboardingGradient(colors, dark),
    [colors, dark],
  );
  const gradId = useId().replace(/:/g, '');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        pressable: {
          flex,
          minHeight: 52,
          borderRadius: 16,
          overflow: 'hidden',
          opacity: disabled ? 0.45 : 1,
        },
        gradientWrap: {
          ...StyleSheet.absoluteFillObject,
        },
        content: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 14,
          paddingHorizontal: 16,
          gap: 6,
        },
        label: {
          fontSize: 15,
          fontWeight: '700',
          color: colors.textOnPrimary || '#FFFFFF',
          letterSpacing: 0.1,
        },
      }),
    [colors, disabled, flex],
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={styles.pressable}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.gradientWrap} pointerEvents="none">
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={gradient.mid} />
              <Stop offset="100%" stopColor={gradient.end} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradId})`} />
        </Svg>
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        {showChevron ? <Text style={styles.label}>›</Text> : null}
      </View>
    </Pressable>
  );
}
