import * as Haptics from 'expo-haptics';
import { SPACING } from '../../constants/ui';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';

const AXIS_KEYS = ['heard', 'safe', 'useful', 'noPressure'];
const SCORES = [1, 2, 3, 4, 5];
const ADVANCE_MS = 280;

function SessionWaiCard({ onSubmit, onSkip, submitting = false }) {
  const WAI = useSectionTranslations('SESSION_WAI');
  const { colors, resolvedScheme } = useTheme();
  const [scores, setScores] = useState({});
  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const axisKey = AXIS_KEYS[step];
  const isLastStep = step === AXIS_KEYS.length - 1;

  const styles = useMemo(
    () => ({
      card: {
        backgroundColor: resolvedScheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(36,35,79,0.03)',
        borderRadius: 16,
        padding: SPACING.HERO_INSET_COMPACT,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: colors.border,
      },
      headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
      },
      progressDots: {
        flexDirection: 'row',
        gap: 6,
      },
      dot: (active, done) => ({
        width: done ? 18 : 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: done || active ? colors.primary : colors.border,
        opacity: active ? 1 : done ? 0.55 : 0.35,
      }),
      skipTop: {
        paddingVertical: SPACING.xs,
        paddingHorizontal: 2,
      },
      skipTopText: {
        fontSize: 13,
        color: colors.textSecondary,
      },
      title: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
        lineHeight: 22,
      },
      subtitle: {
        fontSize: 13,
        lineHeight: 19,
        color: colors.textSecondary,
        marginBottom: 16,
      },
      axisLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: colors.text,
        marginBottom: 12,
        lineHeight: 21,
      },
      scaleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: SPACING.sm,
      },
      scaleBtn: (selected) => ({
        flex: 1,
        minHeight: 44,
        borderRadius: 999,
        borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected
          ? resolvedScheme === 'dark'
            ? `${colors.primary}28`
            : `${colors.primary}12`
          : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }),
      scaleBtnText: (selected) => ({
        fontSize: 15,
        fontWeight: selected ? '600' : '400',
        color: selected ? colors.primary : colors.textSecondary,
      }),
      scaleLegend: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
      },
      legendText: {
        fontSize: 11,
        color: colors.textSecondary,
      },
      actions: { marginTop: 16 },
      primary: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: SPACING.CHIP_INSET_COMPACT,
        alignItems: 'center',
        opacity: submitting ? 0.7 : 1,
      },
      primaryText: {
        color: colors.onPrimary || '#fff',
        fontSize: 15,
        fontWeight: '600',
      },
    }),
    [colors, resolvedScheme],
  );

  const axisLabels = useMemo(
    () => ({
      heard: WAI.AXIS_HEARD,
      safe: WAI.AXIS_SAFE,
      useful: WAI.AXIS_USEFUL,
      noPressure: WAI.AXIS_NO_PRESSURE,
    }),
    [WAI],
  );

  const allFilled = AXIS_KEYS.every((key) => {
    const n = Number(scores[key]);
    return Number.isFinite(n) && n >= 1 && n <= 5;
  });

  const animateStep = useCallback(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    animateStep();
  }, [step, animateStep]);

  const pickScore = useCallback(
    (value) => {
      if (submitting) return;
      Haptics.selectionAsync().catch(() => {});
      setScores((prev) => ({ ...prev, [axisKey]: value }));

      if (!isLastStep) {
        setTimeout(() => setStep((s) => Math.min(s + 1, AXIS_KEYS.length - 1)), ADVANCE_MS);
      }
    },
    [axisKey, isLastStep, submitting],
  );

  const handleSubmit = useCallback(() => {
    if (!allFilled || submitting) return;
    onSubmit?.(scores);
  }, [allFilled, submitting, onSubmit, scores]);

  const handleSkip = useCallback(() => {
    if (submitting) return;
    onSkip?.();
  }, [onSkip, submitting]);

  const currentScore = scores[axisKey];

  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.headerRow}>
        <View style={styles.progressDots}>
          {AXIS_KEYS.map((key, index) => {
            const done = Number.isFinite(Number(scores[key]));
            const active = index === step;
            return <View key={key} style={styles.dot(active, done)} />;
          })}
        </View>
        <TouchableOpacity
          style={styles.skipTop}
          onPress={handleSkip}
          disabled={submitting}
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.skipTopText}>{WAI.CTA_SKIP}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>{WAI.TITLE}</Text>
      <Text style={styles.subtitle}>{WAI.SUBTITLE}</Text>

      <Animated.View style={{ opacity: fadeAnim }}>
        <Text style={styles.axisLabel}>{axisLabels[axisKey]}</Text>
        <View style={styles.scaleRow}>
          {SCORES.map((value) => {
            const selected = currentScore === value;
            return (
              <TouchableOpacity
                key={`${axisKey}-${value}`}
                style={styles.scaleBtn(selected)}
                onPress={() => pickScore(value)}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel={`${axisLabels[axisKey]} ${value}`}
                accessibilityState={{ selected }}
              >
                <Text style={styles.scaleBtnText(selected)}>{value}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.scaleLegend}>
          <Text style={styles.legendText}>{WAI.SCALE_LOW}</Text>
          <Text style={styles.legendText}>{WAI.SCALE_HIGH}</Text>
        </View>
      </Animated.View>

      {isLastStep && allFilled ? (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primary}
            onPress={handleSubmit}
            disabled={submitting}
            accessibilityRole="button"
          >
            {submitting ? (
              <ActivityIndicator color={colors.onPrimary || '#fff'} />
            ) : (
              <Text style={styles.primaryText}>{WAI.CTA_SUBMIT}</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

export default memo(SessionWaiCard);
