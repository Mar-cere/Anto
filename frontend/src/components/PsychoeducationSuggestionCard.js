/**
 * Tarjeta nativa de psicoeducación en chat (#78 / #85).
 */
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { usePsychoeducationTexts } from '../screens/techniques/psychoeducationTexts';
import { getTopicVisual } from '../screens/techniques/psychoeducationTopicVisuals';
import { topicFromInterventionId } from '../utils/psychoeducationTopic';
import { getFocusTheme } from '../styles/focusCardTheme';

const PsychoeducationSuggestionCard = ({ suggestion, onPress, onDismiss }) => {
  const { colors, resolvedScheme } = useTheme();
  const texts = usePsychoeducationTexts();
  const t = useMemo(() => getFocusTheme(colors, resolvedScheme), [colors, resolvedScheme]);
  const isCompact = suggestion?.cardDisplayMode === 'compact';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const topic =
    suggestion?.params?.topic || topicFromInterventionId(suggestion?.id);
  const visual = useMemo(() => getTopicVisual(topic, colors), [topic, colors]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { marginBottom: 10 },
        card: {
          borderRadius: isCompact ? 16 : 22,
          padding: isCompact ? 10 : 14,
          backgroundColor: colors.cardBackground ?? colors.card,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
          borderLeftWidth: 3,
          shadowColor: colors.glassShadow ?? colors.shadowAmbient,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 2,
        },
        badgeRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: isCompact ? 4 : 8,
        },
        badge: {
          fontSize: 11,
          fontWeight: '700',
          color: colors.primary,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
          marginLeft: 6,
        },
        title: {
          fontSize: isCompact ? 15 : 16,
          fontWeight: '700',
          color: colors.text,
          marginBottom: isCompact ? 0 : 6,
        },
        compactRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 8,
        },
        compactCta: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 999,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
        },
        compactCtaText: { fontSize: 12, fontWeight: '600', color: colors.primary, marginRight: 2 },
        summary: { fontSize: 13, lineHeight: 19, color: colors.textSecondary, marginBottom: 8 },
        mechanism: {
          fontSize: 12,
          lineHeight: 17,
          color: colors.textSecondary,
          fontStyle: 'italic',
          marginBottom: 8,
        },
        steps: { marginBottom: 12, gap: 4 },
        stepText: { fontSize: 12, lineHeight: 17, color: colors.textSecondary },
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
    [colors, t, isCompact],
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
  const microSteps =
    isCompact
      ? []
      : Array.isArray(suggestion.microSteps)
        ? suggestion.microSteps.filter((s) => typeof s === 'string' && s.trim()).slice(0, 2)
        : [];

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
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: visual.borderLeft }]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        <View style={styles.badgeRow}>
          <View
            style={{
              width: isCompact ? 28 : 32,
              height: isCompact ? 28 : 32,
              borderRadius: 10,
              backgroundColor: visual.iconBg,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 4,
            }}
          >
            <MaterialCommunityIcons
              name={visual.icon}
              size={isCompact ? 16 : 18}
              color={visual.accent}
            />
          </View>
          {!isCompact ? (
            <Text style={[styles.badge, { color: visual.accent }]}>{texts.CARD_BADGE}</Text>
          ) : null}
        </View>
        <Text style={styles.title}>{title}</Text>
        {isCompact ? (
          <View style={styles.compactRow}>
            <View style={styles.compactCta}>
              <Text style={styles.compactCtaText}>{texts.CARD_CTA_COMPACT || 'Abrir'}</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </View>
          </View>
        ) : (
          <>
            {summary ? <Text style={styles.summary}>{summary}</Text> : null}
            {suggestion.mechanismLine ? (
              <Text style={styles.mechanism}>{suggestion.mechanismLine}</Text>
            ) : null}
            {microSteps.length > 0 ? (
              <View style={styles.steps}>
                {microSteps.map((step, index) => (
                  <Text key={`${suggestion.id}-step-${index}`} style={styles.stepText}>
                    {index + 1}. {step}
                  </Text>
                ))}
              </View>
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
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default PsychoeducationSuggestionCard;
