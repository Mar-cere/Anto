import React, { useId, useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { resolveOnboardingGradient } from '../../utils/onboardingBrand';

/**
 * CTA con gradiente de marca — `commit` usa el espectro índigo→azul→cyan del cierre.
 */
export default function OnboardingGradientButton({
  label,
  onPress,
  flex = 1,
  showChevron = false,
  disabled = false,
  loading = false,
  variant = 'default',
}) {
  const { colors, resolvedScheme } = useTheme();
  const dark = resolvedScheme === 'dark';
  const gradient = useMemo(
    () => resolveOnboardingGradient(colors, dark),
    [colors, dark],
  );
  const gradId = useId().replace(/:/g, '');
  const isCommit = variant === 'commit';

  const gradientStops = useMemo(
    () =>
      isCommit
        ? [
            { offset: '0%', color: gradient.indigo },
            { offset: '48%', color: gradient.mid },
            { offset: '100%', color: gradient.start },
          ]
        : [
            { offset: '0%', color: gradient.mid },
            { offset: '55%', color: gradient.indigo },
            { offset: '100%', color: gradient.warm },
          ],
    [gradient, isCommit],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        pressable: {
          flex,
          minHeight: isCommit ? 56 : 52,
          borderRadius: 16,
          overflow: 'hidden',
          opacity: disabled || loading ? 0.45 : 1,
          ...(isCommit
            ? {
                shadowColor: gradient.indigo,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: dark ? 0.35 : 0.22,
                shadowRadius: 10,
                elevation: 4,
              }
            : null),
        },
        gradientWrap: {
          ...StyleSheet.absoluteFillObject,
        },
        content: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: isCommit ? 16 : 14,
          paddingHorizontal: 16,
          gap: 6,
        },
        label: {
          fontSize: isCommit ? 16 : 15,
          fontWeight: '700',
          color: colors.textOnPrimary || '#FFFFFF',
          letterSpacing: isCommit ? 0.2 : 0.1,
        },
      }),
    [colors, dark, disabled, flex, gradient.indigo, isCommit, loading],
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={styles.pressable}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.gradientWrap} pointerEvents="none">
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              {gradientStops.map((stop) => (
                <Stop
                  key={stop.offset}
                  offset={stop.offset}
                  stopColor={stop.color}
                />
              ))}
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradId})`} />
        </Svg>
      </View>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={colors.textOnPrimary || '#FFFFFF'} size="small" />
        ) : (
          <>
            <Text style={styles.label}>{label}</Text>
            {showChevron ? <Text style={styles.label}>›</Text> : null}
          </>
        )}
      </View>
    </Pressable>
  );
}
