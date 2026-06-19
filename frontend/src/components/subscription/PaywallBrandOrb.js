import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

function PaywallBrandOrb({ size = 88 }) {
  const { colors, resolvedScheme } = useTheme();
  const pulse = useRef(new Animated.Value(1)).current;
  const dark = resolvedScheme === 'dark';

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const ring = size + 28;
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          width: ring,
          height: ring,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        },
        glow: {
          position: 'absolute',
          width: ring,
          height: ring,
          borderRadius: ring / 2,
          backgroundColor: dark ? 'rgba(68, 215, 251, 0.12)' : 'rgba(30, 131, 211, 0.14)',
        },
        orbShell: {
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          borderWidth: 2,
          borderColor: dark ? 'rgba(120, 230, 255, 0.45)' : 'rgba(255,255,255,0.55)',
        },
      }),
    [dark, ring, size],
  );

  return (
    <Animated.View style={[styles.wrap, { transform: [{ scale: pulse }] }]}>
      <View style={styles.glow} />
      <View style={styles.orbShell}>
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id="paywallOrbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={colors.primaryBright || '#44D7FB'} />
              <Stop offset="55%" stopColor={colors.primary || '#1E83D3'} />
              <Stop offset="100%" stopColor={dark ? '#5B4BD4' : '#24214F'} />
            </LinearGradient>
          </Defs>
          <Circle cx={size / 2} cy={size / 2} r={size / 2 - 1} fill="url(#paywallOrbGrad)" />
          <Circle
            cx={size * 0.34}
            cy={size * 0.3}
            r={size * 0.12}
            fill="rgba(255,255,255,0.35)"
          />
        </Svg>
      </View>
    </Animated.View>
  );
}

export default memo(PaywallBrandOrb);
