import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Text, Pressable, Animated, StyleSheet } from 'react-native';
import quotesByLanguage from '../data/quotes';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import { createDashboardStyles } from '../styles/dashboardTheme';
import DashboardSection from './dashboard/DashboardSection';

const QuoteSection = () => {
  const DASH = useSectionTranslations('DASH');
  const { language } = useLanguage();
  const { colors, resolvedScheme } = useTheme();
  const styles = useMemo(
    () => createDashboardStyles(colors, resolvedScheme),
    [colors, resolvedScheme],
  );
  const quoteStyles = useMemo(
    () =>
      StyleSheet.create({
        quoteText: {
          fontSize: 15,
          lineHeight: 23,
          color: colors.text,
          fontStyle: 'italic',
          fontWeight: '400',
        },
      }),
    [colors.text],
  );
  const [currentQuote, setCurrentQuote] = useState('');
  const [fadeAnim] = useState(new Animated.Value(1));
  const localizedQuotes = useMemo(
    () => (language === 'en' ? quotesByLanguage.en : quotesByLanguage.es),
    [language],
  );

  const getRandomQuote = useCallback(() => {
    const source = Array.isArray(localizedQuotes) && localizedQuotes.length > 0
      ? localizedQuotes
      : quotesByLanguage.es;
    const randomIndex = Math.floor(Math.random() * source.length);
    return source[randomIndex];
  }, [localizedQuotes]);

  const changeQuote = useCallback(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    setCurrentQuote(getRandomQuote());
  }, [fadeAnim, getRandomQuote]);

  useEffect(() => {
    setCurrentQuote(getRandomQuote());
  }, [getRandomQuote]);

  useEffect(() => {
    const interval = setInterval(changeQuote, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [changeQuote]);

  return (
    <DashboardSection
      title={DASH.QUOTE_KICKER}
      footerLabel={DASH.QUOTE_ACTION}
      onFooterPress={changeQuote}
      accessibilityLabel={DASH.QUOTE_A11Y_LABEL}
    >
      <Pressable
        onPress={changeQuote}
        style={({ pressed }) => [styles.surfaceCard, pressed && { opacity: 0.92 }]}
        accessibilityRole="button"
        accessibilityLabel={DASH.QUOTE_A11Y_LABEL}
        accessibilityHint={DASH.QUOTE_A11Y_HINT}
      >
        <Animated.Text style={[quoteStyles.quoteText, { opacity: fadeAnim }]} numberOfLines={4}>
          {currentQuote}
        </Animated.Text>
      </Pressable>
    </DashboardSection>
  );
};

export default QuoteSection;
