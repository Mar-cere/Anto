import * as Haptics from 'expo-haptics';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useSectionTranslations } from '../hooks/useTranslations';

const AXIS_KEYS = ['heard', 'safe', 'useful', 'noPressure'];
const SCORES = [1, 2, 3, 4, 5];

function SessionWaiCard({ onSubmit, onSkip, submitting = false }) {
  const WAI = useSectionTranslations('SESSION_WAI');
  const { colors, resolvedScheme } = useTheme();
  const [scores, setScores] = useState({});

  const styles = useMemo(
    () => ({
      card: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: colors.border,
      },
      kicker: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        color: colors.textSecondary,
        marginBottom: 6,
      },
      title: {
        fontSize: 17,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
      },
      subtitle: {
        fontSize: 14,
        lineHeight: 20,
        color: colors.textSecondary,
        marginBottom: 14,
      },
      axisBlock: { marginBottom: 14 },
      axisLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text,
        marginBottom: 8,
      },
      scaleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 6,
      },
      scaleBtn: (selected) => ({
        flex: 1,
        minHeight: 40,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected
          ? resolvedScheme === 'dark'
            ? `${colors.primary}33`
            : `${colors.primary}18`
          : colors.background,
        alignItems: 'center',
        justifyContent: 'center',
      }),
      scaleBtnText: (selected) => ({
        fontSize: 15,
        fontWeight: selected ? '700' : '500',
        color: selected ? colors.primary : colors.textSecondary,
      }),
      scaleLegend: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
      },
      legendText: {
        fontSize: 11,
        color: colors.textSecondary,
      },
      actions: { marginTop: 4, gap: 10 },
      primary: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        opacity: submitting ? 0.7 : 1,
      },
      primaryText: {
        color: colors.onPrimary || '#fff',
        fontSize: 16,
        fontWeight: '600',
      },
      secondary: {
        paddingVertical: 10,
        alignItems: 'center',
      },
      secondaryText: {
        color: colors.textSecondary,
        fontSize: 15,
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

  const pickScore = useCallback((axis, value) => {
    Haptics.selectionAsync().catch(() => {});
    setScores((prev) => ({ ...prev, [axis]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!allFilled || submitting) return;
    onSubmit?.(scores);
  }, [allFilled, submitting, onSubmit, scores]);

  const handleSkip = useCallback(() => {
    if (submitting) return;
    onSkip?.();
  }, [onSkip, submitting]);

  return (
    <View style={styles.card} accessibilityRole="summary">
      <Text style={styles.kicker}>{WAI.KICKER}</Text>
      <Text style={styles.title}>{WAI.TITLE}</Text>
      <Text style={styles.subtitle}>{WAI.SUBTITLE}</Text>

      {AXIS_KEYS.map((axis) => (
        <View key={axis} style={styles.axisBlock}>
          <Text style={styles.axisLabel}>{axisLabels[axis]}</Text>
          <View style={styles.scaleRow}>
            {SCORES.map((value) => {
              const selected = scores[axis] === value;
              return (
                <TouchableOpacity
                  key={`${axis}-${value}`}
                  style={styles.scaleBtn(selected)}
                  onPress={() => pickScore(axis, value)}
                  disabled={submitting}
                  accessibilityRole="button"
                  accessibilityLabel={`${axisLabels[axis]} ${value}`}
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
        </View>
      ))}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primary}
          onPress={handleSubmit}
          disabled={!allFilled || submitting}
          accessibilityRole="button"
        >
          {submitting ? (
            <ActivityIndicator color={colors.onPrimary || '#fff'} />
          ) : (
            <Text style={styles.primaryText}>{WAI.CTA_SUBMIT}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondary}
          onPress={handleSkip}
          disabled={submitting}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryText}>{WAI.CTA_SKIP}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default memo(SessionWaiCard);
