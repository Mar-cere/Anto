import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import quotes from '../data/quotes';
import { DASH } from '../constants/translations';
import { useTheme } from '../context/ThemeContext';

const QuoteSection = () => {
  const { colors } = useTheme();
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

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          alignSelf: 'stretch',
          marginBottom: 12,
        },
        container: {
          backgroundColor: colors.chromeCard,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.chromeCardBorder,
          marginBottom: 0,
          paddingVertical: 14,
          paddingHorizontal: 14,
        },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        },
        headerLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          flex: 1,
          minWidth: 0,
        },
        iconWrap: {
          width: 30,
          height: 30,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.accentLineSoft,
        },
        headerTitle: {
          color: colors.textSecondary,
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          flex: 1,
          minWidth: 0,
        },
        headerRight: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        headerAction: {
          color: colors.textSecondary,
          fontSize: 13,
          fontWeight: '500',
        },
        quoteText: {
          fontSize: 14,
          color: colors.text,
          fontStyle: 'italic',
          lineHeight: 21,
          fontWeight: '400',
          textAlign: 'left',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.container}
        onPress={changeQuote}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={DASH.QUOTE_A11Y_LABEL}
        accessibilityHint={DASH.QUOTE_A11Y_HINT}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons name="format-quote-open" size={18} color={colors.primary} />
            </View>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {DASH.QUOTE_KICKER}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerAction}>Otra</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
          </View>
        </View>

        <Animated.Text style={[styles.quoteText, { opacity: fadeAnim }]} numberOfLines={3}>
          {currentQuote}
        </Animated.Text>
    </TouchableOpacity>
    </View>
  );
};

export default QuoteSection;
