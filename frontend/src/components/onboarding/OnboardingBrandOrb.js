import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useId, useMemo } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { resolveOnboardingGradient } from '../../utils/onboardingBrand';
import { getWelcomeScreenTheme } from '../../utils/welcomeScreenTheme';

/**
 * Orbe de marca Anto: gradiente relleno + logo siempre visible; chip opcional del paso.
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
  const orbSize = compact ? 88 : 104;
  const logoSize = compact ? 52 : 62;
  const ringPad = 18;
  const wrapSize = orbSize + ringPad;
  const strokeWidth = 3;
  const ringRadius = orbSize / 2 + strokeWidth / 2 + 2;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignItems: 'center',
          marginBottom: compact ? 14 : 18,
        },
        wrap: {
          width: wrapSize,
          height: wrapSize,
          alignItems: 'center',
          justifyContent: 'center',
        },
        halo: {
          position: 'absolute',
          width: wrapSize,
          height: wrapSize,
          borderRadius: wrapSize / 2,
          backgroundColor: dark
            ? 'rgba(68, 215, 251, 0.16)'
            : 'rgba(30, 131, 211, 0.18)',
        },
        orbShell: {
          width: orbSize,
          height: orbSize,
          borderRadius: orbSize / 2,
          overflow: 'hidden',
          borderWidth: 2,
          borderColor: dark ? 'rgba(120, 230, 255, 0.5)' : 'rgba(255, 255, 255, 0.65)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        logo: {
          width: logoSize,
          height: logoSize,
          resizeMode: 'contain',
        },
        chip: {
          position: 'absolute',
          right: -4,
          bottom: -4,
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: dark ? colors.chromeCard : colors.surface,
          borderWidth: 2,
          borderColor: colors.primaryBright || colors.primary,
        },
      }),
    [colors, dark, logoSize, orbSize, wrapSize],
  );

  const center = wrapSize / 2;

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.wrap, { transform: [{ scale }] }]}>
        <View style={styles.halo} />
        <Svg
          width={wrapSize}
          height={wrapSize}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        >
          <Defs>
            <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={gradient.start} />
              <Stop offset="55%" stopColor={gradient.mid} />
              <Stop offset="100%" stopColor={gradient.end} />
            </LinearGradient>
          </Defs>
          <Circle
            cx={center}
            cy={center}
            r={ringRadius}
            stroke={`url(#${gradId})`}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
        </Svg>
        <View style={styles.orbShell}>
          <Svg width={orbSize} height={orbSize} style={StyleSheet.absoluteFillObject}>
            <Defs>
              <LinearGradient id={`${gradId}-fill`} x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={gradient.start} />
                <Stop offset="55%" stopColor={gradient.mid} />
                <Stop offset="100%" stopColor={gradient.end} />
              </LinearGradient>
            </Defs>
            <Circle
              cx={orbSize / 2}
              cy={orbSize / 2}
              r={orbSize / 2 - 1}
              fill={`url(#${gradId}-fill)`}
            />
            <Circle
              cx={orbSize * 0.34}
              cy={orbSize * 0.3}
              r={orbSize * 0.11}
              fill="rgba(255,255,255,0.32)"
            />
          </Svg>
          <Image
            source={welcomeTheme.logo}
            style={styles.logo}
            accessibilityIgnoresInvertColors
          />
        </View>
        {stepIcon ? (
          <View style={styles.chip}>
            <MaterialCommunityIcons
              name={stepIcon}
              size={16}
              color={colors.primary}
            />
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}
