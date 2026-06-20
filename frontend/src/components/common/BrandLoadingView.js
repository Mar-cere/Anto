import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { getWelcomeScreenTheme } from '../../utils/welcomeScreenTheme';
import DashboardBrandBackdrop from '../dashboard/DashboardBrandBackdrop';
import ParticleBackground from '../ParticleBackground';
import WelcomeBrandBackdrop from '../welcome/WelcomeBrandBackdrop';

function BrandLoadingView({ variant = 'dashboard', testID = 'brand-loading-view' }) {
  const { colors, resolvedScheme } = useTheme();
  const welcomeTheme = useMemo(
    () => getWelcomeScreenTheme(resolvedScheme, colors),
    [resolvedScheme, colors],
  );
  const pulse = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const scaleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.05,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 0.7,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0.35,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    scaleLoop.start();
    glowLoop.start();
    return () => {
      scaleLoop.stop();
      glowLoop.stop();
    };
  }, [pulse, glow]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        },
        logoWrap: {
          width: 96,
          height: 96,
          alignItems: 'center',
          justifyContent: 'center',
        },
        glow: {
          position: 'absolute',
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: welcomeTheme.logoGlow,
        },
        logoShell: {
          width: 72,
          height: 72,
          borderRadius: 36,
          overflow: 'hidden',
        },
        logo: {
          width: 72,
          height: 72,
          borderRadius: 36,
        },
      }),
    [colors.background, variant, welcomeTheme.logoGlow],
  );

  const logoSource = welcomeTheme.logo;

  return (
    <View style={styles.root} testID={testID} accessibilityRole="progressbar" accessibilityLabel="Cargando">
      {variant === 'welcome' ? <WelcomeBrandBackdrop /> : <DashboardBrandBackdrop />}
      <ParticleBackground />
      <View style={styles.logoWrap}>
        <Animated.View style={[styles.glow, { opacity: glow }]} />
        <Animated.View style={[styles.logoShell, { transform: [{ scale: pulse }] }]}>
          <Image
            source={logoSource}
            style={styles.logo}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        </Animated.View>
      </View>
    </View>
  );
}

export default memo(BrandLoadingView);
