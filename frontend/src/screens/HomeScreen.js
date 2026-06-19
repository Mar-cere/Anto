/**
 * Pantalla de bienvenida — primera impresión de la app.
 */
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import ParticleBackground from '../components/ParticleBackground';
import WelcomeBrandBackdrop from '../components/welcome/WelcomeBrandBackdrop';
import { ANIMATION_DURATIONS, ANIMATION_VALUES } from '../constants/animations';
import { ROUTES } from '../constants/routes';
import { SPACING } from '../constants/ui';
import { useTheme } from '../context/ThemeContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import { getWelcomeScreenTheme } from '../utils/welcomeScreenTheme';

const DEFAULT_TEXTS = {
  BRAND_NAME: 'Anto',
  BADGE: '1 día gratis · sin tarjeta',
  HEADLINE_PREFIX: 'Tu espacio para',
  HEADLINE_ACCENT: 'sentirte mejor.',
  SUBTITLE:
    'Anto te acompaña cuando lo necesitás. Sin reemplazar a un profesional, sin juzgarte.',
  START_FREE: 'Empezar gratis',
  ALREADY_HAVE_ACCOUNT: 'Ya tengo cuenta',
  FAQ: 'Preguntas frecuentes',
  START_FREE_HINT: 'Crear una cuenta nueva con prueba gratuita',
  SIGN_IN_HINT: 'Iniciar sesión con tu cuenta existente',
};

function WelcomeGradientButton({
  label,
  onPress,
  testID,
  variant = 'primary',
  accessibilityHint,
  theme,
  styles,
}) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      testID={testID}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.actionBtn,
        !isPrimary && styles.actionBtnSecondary,
        pressed && styles.actionBtnPressed,
      ]}
    >
      {isPrimary ? (
        <View style={styles.actionBtnGradientWrap}>
          <Svg width="100%" height="100%" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="welcomePrimaryGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor={theme.gradientStart} />
                <Stop offset="100%" stopColor={theme.gradientEnd} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#welcomePrimaryGrad)" />
          </Svg>
        </View>
      ) : null}
      <Text
        style={[
          styles.actionBtnText,
          isPrimary ? styles.actionBtnTextPrimary : styles.actionBtnTextSecondary,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const HomeScreen = () => {
  const translated = useSectionTranslations('HOME');
  const TEXTS = useMemo(
    () => ({
      ...DEFAULT_TEXTS,
      ...(translated || {}),
    }),
    [translated],
  );
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle, resolvedScheme } = useTheme();
  const theme = useMemo(
    () => getWelcomeScreenTheme(resolvedScheme, colors),
    [resolvedScheme, colors],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: theme.background,
        },
        safe: {
          flex: 1,
        },
        content: {
          flex: 1,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
        },
        brandRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          marginBottom: 18,
        },
        logo: {
          width: 48,
          height: 48,
        },
        brandName: {
          fontSize: 28,
          fontWeight: '700',
          color: theme.text,
          letterSpacing: -0.3,
        },
        badge: {
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 999,
          backgroundColor: theme.badgeBg,
          borderWidth: 1,
          borderColor: theme.badgeBorder,
          marginBottom: 28,
        },
        badgeDot: {
          width: 7,
          height: 7,
          borderRadius: 4,
          backgroundColor: theme.accent,
        },
        badgeText: {
          color: theme.textMuted,
          fontSize: 13,
          fontWeight: '600',
        },
        hero: {
          marginBottom: 12,
        },
        headline: {
          fontSize: 34,
          lineHeight: 42,
          fontWeight: '700',
          color: theme.text,
          marginBottom: 14,
        },
        headlineAccent: {
          color: theme.accent,
        },
        subtitle: {
          fontSize: 16,
          lineHeight: 24,
          color: theme.textMuted,
          maxWidth: 340,
        },
        spacer: {
          flex: 1,
          minHeight: 24,
        },
        actions: {
          gap: 12,
          marginBottom: 18,
        },
        actionBtn: {
          width: '100%',
          minHeight: 54,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        actionBtnGradientWrap: {
          ...StyleSheet.absoluteFillObject,
        },
        actionBtnSecondary: {
          backgroundColor: theme.secondaryBg,
          borderWidth: 1,
          borderColor: theme.secondaryBorder,
        },
        actionBtnPressed: {
          opacity: 0.88,
        },
        actionBtnText: {
          fontSize: 17,
          fontWeight: '700',
        },
        actionBtnTextPrimary: {
          color: theme.primaryBtnText,
        },
        actionBtnTextSecondary: {
          color: theme.secondaryBtnText,
          fontWeight: '600',
        },
        faqWrap: {
          alignSelf: 'center',
          paddingVertical: 8,
        },
        faqText: {
          color: theme.faq,
          fontSize: 15,
          fontWeight: '600',
        },
      }),
    [theme],
  );

  const fadeAnim = useRef(new Animated.Value(ANIMATION_VALUES.INITIAL_OPACITY)).current;
  const translateYAnim = useRef(new Animated.Value(ANIMATION_VALUES.INITIAL_TRANSLATE_Y)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: ANIMATION_VALUES.FINAL_OPACITY,
        duration: ANIMATION_DURATIONS.SLOW,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: ANIMATION_VALUES.FINAL_TRANSLATE_Y,
        duration: ANIMATION_DURATIONS.SLOW,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateYAnim]);

  const handleNavigation = (route) => {
    navigation.navigate(route);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={theme.background} />
      <WelcomeBrandBackdrop />
      <ParticleBackground />

      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <Animated.View
          style={[
            styles.content,
            {
              paddingTop: Math.max(insets.top, 12),
              paddingBottom: Math.max(insets.bottom, 20),
              opacity: fadeAnim,
              transform: [{ translateY: translateYAnim }],
            },
          ]}
        >
          <View style={styles.brandRow}>
            <Image
              source={theme.logo}
              style={styles.logo}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            <Text style={styles.brandName} accessibilityRole="header">
              {TEXTS.BRAND_NAME}
            </Text>
          </View>

          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>{TEXTS.BADGE}</Text>
          </View>

          <View style={styles.hero}>
            <Text testID="home-welcome-title" style={styles.headline}>
              {TEXTS.HEADLINE_PREFIX}
              {'\n'}
              <Text style={styles.headlineAccent}>{TEXTS.HEADLINE_ACCENT}</Text>
            </Text>
            <Text style={styles.subtitle}>{TEXTS.SUBTITLE}</Text>
          </View>

          <View style={styles.spacer} />

          <View style={styles.actions}>
            <WelcomeGradientButton
              testID="home-start-free-button"
              label={TEXTS.START_FREE}
              onPress={() => handleNavigation(ROUTES.REGISTER)}
              accessibilityHint={TEXTS.START_FREE_HINT}
              theme={theme}
              styles={styles}
            />
            <WelcomeGradientButton
              testID="home-sign-in-button"
              label={TEXTS.ALREADY_HAVE_ACCOUNT}
              variant="secondary"
              onPress={() => handleNavigation(ROUTES.SIGN_IN)}
              accessibilityHint={TEXTS.SIGN_IN_HINT}
              theme={theme}
              styles={styles}
            />
          </View>

          <Pressable
            onPress={() => handleNavigation('FaQ')}
            accessibilityRole="link"
            accessibilityLabel={TEXTS.FAQ}
            style={styles.faqWrap}
          >
            <Text style={styles.faqText}>{TEXTS.FAQ}</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

export default HomeScreen;
