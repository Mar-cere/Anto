/**
 * Tarjeta nativa de psicoeducación en chat (#78 / #85).
 */
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { usePsychoeducationTexts } from '../screens/techniques/psychoeducationTexts';
import { getFocusTheme } from '../styles/focusCardTheme';

const PsychoeducationSuggestionCard = ({ suggestion, onPress, onDismiss }) => {
  const { colors, resolvedScheme } = useTheme();
  const texts = usePsychoeducationTexts();
  const t = useMemo(() => getFocusTheme(colors, resolvedScheme), [colors, resolvedScheme]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { marginBottom: 10 },
        card: {
          borderRadius: 16,
          padding: 14,
          backgroundColor: colors.card,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
        },
        badgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
        badge: {
          fontSize: 11,
          fontWeight: '700',
          color: colors.primary,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
          marginLeft: 6,
        },
        title: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
        summary: { fontSize: 13, lineHeight: 19, color: colors.textSecondary, marginBottom: 8 },
        mechanism: {
          fontSize: 12,
          lineHeight: 17,
          color: colors.textSecondary,
          fontStyle: 'italic',
          marginBottom: 12,
        },
        footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        cta: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.primary,
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 999,
        },
        ctaText: { color: colors.textOnPrimary, fontSize: 13, fontWeight: '600', marginRight: 4 },
        minutes: { fontSize: 12, color: colors.textSecondary },
      }),
    [colors, t],
  );

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) {
          translateX.setValue(g.dx);
          opacity.setValue(1 + g.dx / 200);
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -100 && onDismiss) {
          Animated.parallel([
            Animated.timing(translateX, { toValue: -500, duration: 200, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          ]).start(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onDismiss();
          });
        } else {
          Animated.parallel([
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
            Animated.spring(opacity, { toValue: 1, useNativeDriver: true }),
          ]).start();
        }
      },
    }),
  ).current;

  const title = suggestion.previewTitle || suggestion.label;
  const summary = suggestion.previewSummary || suggestion.description;
  const minutes = suggestion.estimatedMinutes || 2;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(suggestion);
  };

  if (!suggestion?.id) return null;

  return (
    <Animated.View
      style={[styles.container, { opacity: Animated.multiply(fadeAnim, opacity), transform: [{ translateX }] }]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.85}>
        <View style={styles.badgeRow}>
          <MaterialCommunityIcons name="book-open-page-variant" size={18} color={colors.primary} />
          <Text style={styles.badge}>{texts.CARD_BADGE}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        {summary ? <Text style={styles.summary}>{summary}</Text> : null}
        {suggestion.mechanismLine ? (
          <Text style={styles.mechanism}>{suggestion.mechanismLine}</Text>
        ) : null}
        <View style={styles.footer}>
          <View style={styles.cta}>
            <Text style={styles.ctaText}>{texts.CARD_CTA_READ}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textOnPrimary} />
          </View>
          <Text style={styles.minutes}>
            {texts.CARD_MINUTES.replace('{n}', String(minutes))}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default PsychoeducationSuggestionCard;
