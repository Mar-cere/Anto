import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useId, useMemo, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Path } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import {
  buildConicRingArcPath,
  buildConicWedgePath,
  getOnboardingConicSegments,
  resolveOnboardingGradient,
} from '../../utils/onboardingBrand';
import { getWelcomeScreenTheme } from '../../utils/welcomeScreenTheme';

/**
 * Orbe de marca Anto: conic-gradient de 4 paradas + logo; chip del paso fuera del relleno.
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
  const conicSegments = useMemo(
    () => getOnboardingConicSegments(gradient),
    [gradient],
  );
  const gradId = useId().replace(/:/g, '');
  const chipOpacity = useRef(new Animated.Value(stepIcon ? 1 : 0)).current;
  const chipScale = useRef(new Animated.Value(stepIcon ? 1 : 0.88)).current;

  const compact = size === 'compact';
  const orbSize = compact ? 88 : 104;
  const logoSize = compact ? 60 : 72;
  const ringPad = 18;
  const wrapSize = orbSize + ringPad;
  const strokeWidth = 3;
  const ringRadius = orbSize / 2 + strokeWidth / 2 + 2;
  const center = wrapSize / 2;
  const fillRadius = orbSize / 2 - 1;
  const chipOrbitRadius = orbSize / 2 + strokeWidth + 10;
  const chipAngleDeg = 52;
  const chipRad = (chipAngleDeg * Math.PI) / 180;
  const chipSize = 30;

  useEffect(() => {
    if (!stepIcon) {
      chipOpacity.setValue(0);
      chipScale.setValue(0.88);
      return;
    }
    chipOpacity.setValue(0);
    chipScale.setValue(0.88);
    Animated.parallel([
      Animated.timing(chipOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(chipScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [chipOpacity, chipScale, stepIcon]);

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
          left: center + Math.cos(chipRad) * chipOrbitRadius - chipSize / 2,
          top: center + Math.sin(chipRad) * chipOrbitRadius - chipSize / 2,
          width: chipSize,
          height: chipSize,
          borderRadius: chipSize / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: dark ? colors.chromeCard : colors.surface,
          borderWidth: 2,
          borderColor: colors.primaryBright || colors.primary,
          zIndex: 3,
        },
      }),
    [
      center,
      chipOrbitRadius,
      chipRad,
      chipSize,
      colors,
      compact,
      dark,
      logoSize,
      orbSize,
      wrapSize,
    ],
  );

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
          <Defs />
          {conicSegments.map((segment, index) => (
            <Path
              key={`${gradId}-ring-${index}`}
              d={buildConicRingArcPath(
                center,
                center,
                ringRadius,
                segment.from,
                segment.to,
              )}
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="transparent"
            />
          ))}
        </Svg>
        <View style={styles.orbShell}>
          <Svg width={orbSize} height={orbSize} style={StyleSheet.absoluteFillObject}>
            <Defs />
            {conicSegments.map((segment, index) => (
              <Path
                key={`${gradId}-fill-${index}`}
                d={buildConicWedgePath(
                  orbSize / 2,
                  orbSize / 2,
                  fillRadius,
                  segment.from,
                  segment.to,
                )}
                fill={segment.color}
              />
            ))}
            <Circle
              cx={orbSize * 0.28}
              cy={orbSize * 0.22}
              r={orbSize * 0.1}
              fill="rgba(255,255,255,0.22)"
            />
          </Svg>
          <Image
            source={welcomeTheme.logo}
            style={styles.logo}
            accessibilityIgnoresInvertColors
          />
        </View>
        {stepIcon ? (
          <Animated.View
            style={[
              styles.chip,
              {
                opacity: chipOpacity,
                transform: [{ scale: chipScale }],
              },
            ]}
          >
            <MaterialCommunityIcons
              name={stepIcon}
              size={15}
              color={colors.primary}
            />
          </Animated.View>
        ) : null}
      </Animated.View>
    </View>
  );
}
