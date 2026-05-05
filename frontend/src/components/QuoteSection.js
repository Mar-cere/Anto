import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import quotes from '../data/quotes';
import { DASH } from '../constants/translations';
import { colors } from '../styles/globalStyles';
import { FOCUS_PANEL, FOCUS_BODY_SOFT, FOCUS_KICKER_COLOR } from '../styles/focusCardTheme';

const QuoteSection = () => {
  const [currentQuote, setCurrentQuote] = useState('');
  const [fadeAnim] = useState(new Animated.Value(1));

  const getRandomQuote = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
  }, []);

  const changeQuote = useCallback(() => {
    // Animación de fade out
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();

    // Cambiar la frase
    setCurrentQuote(getRandomQuote());
  }, [fadeAnim, getRandomQuote]);

  // Establecer una frase inicial al montar el componente
  useEffect(() => {
    setCurrentQuote(getRandomQuote());
  }, [getRandomQuote]);

  // Cambiar la frase cada 24 horas
  useEffect(() => {
    const interval = setInterval(changeQuote, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [changeQuote]);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.kicker}>{DASH.QUOTE_KICKER}</Text>
      <TouchableOpacity
        style={styles.container}
        onPress={changeQuote}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={DASH.QUOTE_A11Y_LABEL}
        accessibilityHint={DASH.QUOTE_A11Y_HINT}
      >
      <View style={styles.quoteContainer}>
        <MaterialCommunityIcons 
          name="format-quote-open" 
          size={22} 
          color={colors.primary} 
          style={styles.quoteIcon}
        />
        
        <Animated.Text style={[styles.quoteText, { opacity: fadeAnim }]}>
          {currentQuote}
        </Animated.Text>
        
        <MaterialCommunityIcons 
          name="format-quote-close" 
          size={22} 
          color={colors.primary} 
          style={styles.quoteIcon}
        />
      </View>
    </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: FOCUS_KICKER_COLOR,
    marginBottom: 10,
    marginHorizontal: 4,
  },
  container: {
    ...FOCUS_PANEL,
    marginBottom: 0,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  quoteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  quoteText: {
    flex: 1,
    fontSize: 14,
    color: FOCUS_BODY_SOFT,
    fontStyle: 'italic',
    lineHeight: 21,
    fontWeight: '400',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  quoteIcon: {
    opacity: 0.85,
  },
});

export default QuoteSection;
