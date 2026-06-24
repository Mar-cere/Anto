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
  const fillGradId = `${gradId}-fill`;

  const renderOrbGradient = (id) => (
    <LinearGradient id={id} x1="8%" y1="6%" x2="92%" y2="94%">
      <Stop offset="0%" stopColor={gradient.start} />
      <Stop offset="32%" stopColor={gradient.mid} />
      <Stop offset="68%" stopColor={gradient.indigo} />
      <Stop offset="100%" stopColor={gradient.warm} />
    </LinearGradient>
  );

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
            ? 'rgba(139, 127, 232, 0.14)'
            : 'rgba(91, 75, 212, 0.1)',
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
          <Defs>{renderOrbGradient(gradId)}</Defs>
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
            <Defs>{renderOrbGradient(fillGradId)}</Defs>
            <Circle
              cx={orbSize / 2}
              cy={orbSize / 2}
              r={orbSize / 2 - 1}
              fill={`url(#${fillGradId})`}
            />
            <Circle
              cx={orbSize * 0.72}
              cy={orbSize * 0.78}
              r={orbSize * 0.09}
              fill="rgba(232, 155, 184, 0.35)"
            />
            <Circle
              cx={orbSize * 0.28}
              cy={orbSize * 0.22}
              r={orbSize * 0.1}
              fill="rgba(255,255,255,0.28)"
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
