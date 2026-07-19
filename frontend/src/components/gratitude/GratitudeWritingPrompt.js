import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import quotesByLanguage from '../../data/quotes';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { getFocusTheme } from '../../styles/focusCardTheme';
import { SPACING } from '../../constants/ui';

/**
 * Prompt de escritura con frase rotativa (antes en el home como "Momento para ti").
 */
export default function GratitudeWritingPrompt({
  kicker,
  anotherLabel,
  a11yLabel,
  a11yHint,
}) {
  const { language } = useLanguage();
  const { colors, resolvedScheme } = useTheme();
  const t = useMemo(() => getFocusTheme(colors, resolvedScheme), [colors, resolvedScheme]);
  const [currentQuote, setCurrentQuote] = useState('');
  const [fadeAnim] = useState(() => new Animated.Value(1));

  const localizedQuotes = useMemo(
    () => (language === 'en' ? quotesByLanguage.en : quotesByLanguage.es),
    [language],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          marginTop: 14,
          marginBottom: 4,
          padding: SPACING.CARD_INNER_INSET,
          borderRadius: 22,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
          backgroundColor: colors.cardBackground,
        },
        kicker: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          color: t.FOCUS_KICKER_COLOR,
          marginBottom: 8,
        },
        quoteText: {
          fontSize: 15,
          lineHeight: 23,
          color: colors.text,
          fontStyle: 'italic',
        },
        footer: {
          marginTop: 12,
          alignSelf: 'flex-start',
        },
        footerText: {
          fontSize: 13,
          fontWeight: '700',
          color: colors.primary,
        },
      }),
    [colors, t],
  );

  const getRandomQuote = useCallback(() => {
    const source =
      Array.isArray(localizedQuotes) && localizedQuotes.length > 0
        ? localizedQuotes
        : quotesByLanguage.es;
    const randomIndex = Math.floor(Math.random() * source.length);
    return source[randomIndex];
  }, [localizedQuotes]);

  const changeQuote = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
    setCurrentQuote(getRandomQuote());
  }, [fadeAnim, getRandomQuote]);

  useEffect(() => {
    setCurrentQuote(getRandomQuote());
  }, [getRandomQuote]);

  if (!currentQuote) return null;

  return (
    <Pressable
      onPress={changeQuote}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint={a11yHint}
    >
      <Text style={styles.kicker}>{kicker}</Text>
      <Animated.Text style={[styles.quoteText, { opacity: fadeAnim }]} numberOfLines={5}>
        {currentQuote}
      </Animated.Text>
      <View style={styles.footer}>
        <Text style={styles.footerText}>{anotherLabel}</Text>
      </View>
    </Pressable>
  );
}
