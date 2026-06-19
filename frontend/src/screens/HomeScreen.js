/**
 * Pantalla de bienvenida — primera impresión de la app.
 */
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import PaywallBrandOrb from '../components/subscription/PaywallBrandOrb';
import { ANIMATION_DURATIONS, ANIMATION_VALUES } from '../constants/animations';
import { ROUTES } from '../constants/routes';
import { SPACING } from '../constants/ui';
import { useAuth } from '../context/AuthContext';
import { useSectionTranslations } from '../hooks/useTranslations';

const WELCOME_COLORS = {
  background: '#030A24',
  gradientTop: '#0B1638',
  text: '#F5F7FF',
  textMuted: '#A3B8E8',
  accent: '#44D7FB',
  badgeBg: 'rgba(255, 255, 255, 0.06)',
  badgeBorder: 'rgba(255, 255, 255, 0.12)',
  secondaryBg: 'rgba(255, 255, 255, 0.06)',
  secondaryBorder: 'rgba(255, 255, 255, 0.14)',
  faq: '#8FA8E8',
};

const DEFAULT_TEXTS = {
  BRAND_PREFIX: 'tu',
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

function WelcomeGradientButton({ label, onPress, testID, variant = 'primary', accessibilityHint }) {
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
        <View style={StyleSheet.absoluteFill}>
          <Svg width="100%" height="100%" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="welcomePrimaryGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#1E83D3" />
                <Stop offset="100%" stopColor="#5B4BD4" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" rx="999" ry="999" fill="url(#welcomePrimaryGrad)" />
          </Svg>
        </View>
      ) : null}
      <Text style={[styles.actionBtnText, !isPrimary && styles.actionBtnTextSecondary]}>{label}</Text>
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
  const { loading: authLoading } = useAuth();

  const fadeAnim = useRef(new Animated.Value(ANIMATION_VALUES.INITIAL_OPACITY)).current;
  const translateYAnim = useRef(new Animated.Value(ANIMATION_VALUES.INITIAL_TRANSLATE_Y)).current;

  useEffect(() => {
    if (authLoading) return undefined;
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
    return undefined;
  }, [authLoading, fadeAnim, translateYAnim]);

  const handleNavigation = (route) => {
    navigation.navigate(route);
  };

  if (authLoading) {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={WELCOME_COLORS.background} />
        <ActivityIndicator size="large" color={WELCOME_COLORS.accent} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={WELCOME_COLORS.background} />
      <View style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="welcomeBgGrad" x1="50%" y1="0%" x2="50%" y2="100%">
              <Stop offset="0%" stopColor={WELCOME_COLORS.gradientTop} />
              <Stop offset="100%" stopColor={WELCOME_COLORS.background} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#welcomeBgGrad)" />
        </Svg>
      </View>

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
            <View style={styles.brandOrbWrap}>
              <PaywallBrandOrb size={46} />
            </View>
            <Text style={styles.brandText} accessibilityRole="header">
              <Text style={styles.brandPrefix}>{TEXTS.BRAND_PREFIX}</Text>
              <Text style={styles.brandName}>{TEXTS.BRAND_NAME}</Text>
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
            />
            <WelcomeGradientButton
              testID="home-sign-in-button"
              label={TEXTS.ALREADY_HAVE_ACCOUNT}
              variant="secondary"
              onPress={() => handleNavigation(ROUTES.SIGN_IN)}
              accessibilityHint={TEXTS.SIGN_IN_HINT}
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: WELCOME_COLORS.background,
  },
  safe: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
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
  brandOrbWrap: {
    marginBottom: -16,
  },
  brandText: {
    fontSize: 28,
    color: WELCOME_COLORS.text,
  },
  brandPrefix: {
    fontWeight: '400',
  },
  brandName: {
    fontWeight: '700',
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: WELCOME_COLORS.badgeBg,
    borderWidth: 1,
    borderColor: WELCOME_COLORS.badgeBorder,
    marginBottom: 28,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: WELCOME_COLORS.accent,
  },
  badgeText: {
    color: WELCOME_COLORS.textMuted,
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
    color: WELCOME_COLORS.text,
    marginBottom: 14,
  },
  headlineAccent: {
    color: WELCOME_COLORS.accent,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: WELCOME_COLORS.textMuted,
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
    minHeight: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  actionBtnSecondary: {
    backgroundColor: WELCOME_COLORS.secondaryBg,
    borderWidth: 1,
    borderColor: WELCOME_COLORS.secondaryBorder,
  },
  actionBtnPressed: {
    opacity: 0.88,
  },
  actionBtnText: {
    color: WELCOME_COLORS.text,
    fontSize: 17,
    fontWeight: '700',
  },
  actionBtnTextSecondary: {
    fontWeight: '600',
  },
  faqWrap: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  faqText: {
    color: WELCOME_COLORS.faq,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default HomeScreen;
