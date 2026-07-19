import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SPACING } from '../../constants/ui';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import HabitsTodayProgressRing from './HabitsTodayProgressRing';

const DEFAULT_TEXTS = {
  PACE_GOOD: 'Buen ritmo hoy',
  PACE_START: 'Un paso a la vez',
  PACE_DONE: 'Todo listo por hoy',
  PENDING_ONE: '{count} pendiente',
  PENDING_MANY: '{count} pendientes',
  STREAK: 'racha de {days} días',
};

export default function HabitsProgressSummaryCard({
  completed = 0,
  total = 0,
  pending = 0,
  maxStreak = 0,
}) {
  const { colors } = useTheme();
  const T = useSectionTranslations('TASKS_AND_HABITS');
  const texts = { ...DEFAULT_TEXTS, ...T };

  const paceLabel = useMemo(() => {
    if (total > 0 && pending === 0) return texts.PACE_DONE;
    if (total > 0 && completed >= total / 2) return texts.PACE_GOOD;
    return texts.PACE_START;
  }, [completed, pending, texts, total]);

  const pendingLabel =
    pending === 1
      ? texts.PENDING_ONE.replace('{count}', String(pending))
      : texts.PENDING_MANY.replace('{count}', String(pending));

  const metaParts = [pending > 0 ? pendingLabel : texts.PACE_DONE];
  if (maxStreak > 0) {
    metaParts.push(texts.STREAK.replace('{days}', String(maxStreak)));
  }

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.HERO_INSET_COMPACT,
          padding: SPACING.CARD_INNER_INSET,
          borderRadius: 18,
          backgroundColor: colors.chromeCard,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.chromeCardBorder,
          marginBottom: 12,
        },
        copy: {
          flex: 1,
          minWidth: 0,
        },
        title: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        meta: {
          marginTop: 4,
          color: colors.textSecondary,
          fontSize: 13,
          lineHeight: 18,
        },
        streakHighlight: {
          color: colors.primary,
          fontWeight: '600',
        },
      }),
    [colors],
  );

  const metaText = metaParts.join(' · ');
  const streakIndex = metaText.lastIndexOf(texts.STREAK.split('{days}')[0]);

  return (
    <View style={styles.card} accessibilityRole="summary">
      <HabitsTodayProgressRing completed={completed} total={total} />
      <View style={styles.copy}>
        <Text style={styles.title}>{paceLabel}</Text>
        <Text style={styles.meta}>
          {maxStreak > 0 && streakIndex > 0 ? (
            <>
              {metaText.slice(0, streakIndex)}
              <Text style={styles.streakHighlight}>
                {metaText.slice(streakIndex)}
              </Text>
            </>
          ) : (
            metaText
          )}
        </Text>
      </View>
    </View>
  );
}
