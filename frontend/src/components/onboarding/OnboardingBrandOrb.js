import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useId, useMemo } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { resolveOnboardingGradient } from '../../utils/onboardingBrand';
import { getWelcomeScreenTheme } from '../../utils/welcomeScreenTheme';

/**
 * Orbe de Anto: anillo con gradiente (mockup) + logo o icono del paso dentro.
 */
export default function OnboardingBrandOrb({
  stepIcon = null,
  scale = 1,
  size = 'default',
}) {
  const { colors, resolvedScheme } = useTheme();
  const dark = resolvedScheme === 'dark';
  const welcomeTheme = useMemo(
    () => getWelcomeScreenTheme(resolvedScheme, colors),
    [resolvedScheme, colors],
  );
  const gradient = useMemo(
    () => resolveOnboardingGradient(colors, dark),
    [colors, dark],
  );
  const gradId = useId().replace(/:/g, '');

  const compact = size === 'compact';
  const orbSize = compact ? 84 : 100;
  const logoSize = compact ? 46 : 56;
  const iconSize = compact ? 30 : 34;
  const ringPad = 14;
  const wrapSize = orbSize + ringPad;
  const strokeWidth = 2.5;
  const radius = orbSize / 2 + strokeWidth / 2;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignItems: 'center',
          marginBottom: compact ? 16 : 20,
        },
        wrap: {
          width: wrapSize,
          height: wrapSize,
          alignItems: 'center',
          justifyContent: 'center',
        },
        glow: {
          position: 'absolute',
          width: wrapSize,
          height: wrapSize,
          borderRadius: wrapSize / 2,
          backgroundColor: dark
            ? 'rgba(68, 215, 251, 0.1)'
            : 'rgba(30, 131, 211, 0.12)',
        },
        inner: {
          width: orbSize,
          height: orbSize,
          borderRadius: orbSize / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: dark
            ? 'rgba(10, 30, 69, 0.55)'
            : welcomeTheme.logoGlow,
        },
        logo: {
          width: logoSize,
          height: logoSize,
          resizeMode: 'contain',
        },
      }),
    [compact, dark, logoSize, orbSize, welcomeTheme.logoGlow, wrapSize],
  );

  const center = wrapSize / 2;

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.wrap, { transform: [{ scale }] }]}>
        <View style={styles.glow} />
        <Svg
          width={wrapSize}
          height={wrapSize}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        >
          <Defs>
            <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={gradient.start} />
              <Stop offset="50%" stopColor={gradient.mid} />
              <Stop offset="100%" stopColor={gradient.end} />
            </LinearGradient>
          </Defs>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={`url(#${gradId})`}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
        </Svg>
        <View style={styles.inner}>
          {stepIcon ? (
            <MaterialCommunityIcons
              name={stepIcon}
              size={iconSize}
              color={dark ? colors.primaryBright || colors.primary : colors.primary}
            />
          ) : (
            <Image
              source={welcomeTheme.logo}
              style={styles.logo}
              accessibilityIgnoresInvertColors
            />
          )}
        </View>
      </Animated.View>
    </View>
  );
}
