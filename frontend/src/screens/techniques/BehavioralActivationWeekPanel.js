/**
 * Panel del plan semanal de activación conductual (#88).
 */
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

const STATUS_LABEL_KEY = {
  planned: 'WEEK_STATUS_PLANNED',
  completed: 'WEEK_STATUS_COMPLETED',
  skipped: 'WEEK_STATUS_SKIPPED',
};

const TYPE_META = {
  pleasant: { icon: 'sunny-outline', accentKey: 'pleasant' },
  routine: { icon: 'repeat-outline', accentKey: 'routine' },
};

function slotAccent(colors, type, status) {
  if (status === 'completed') return colors.primary;
  if (status === 'skipped') return colors.textSecondary;
  return type === 'routine' ? colors.primary : colors.accentLineSoft || colors.primary;
}

export default function BehavioralActivationWeekPanel({
  TEXTS,
  colors,
  techniqueScreenStyles,
  styles,
  slots,
  dayLabels,
  loading,
  savingSlotId,
  onRegisterSlot,
  onSkipSlot,
}) {
  const typeLabels = useMemo(
    () => ({
      pleasant: TEXTS.WEEK_TYPE_PLEASANT,
      routine: TEXTS.WEEK_TYPE_ROUTINE,
    }),
    [TEXTS.WEEK_TYPE_PLEASANT, TEXTS.WEEK_TYPE_ROUTINE],
  );

  const progress = useMemo(() => {
    if (!Array.isArray(slots) || slots.length === 0) return null;
    const done = slots.filter((s) => s?.status === 'completed' || s?.status === 'skipped').length;
    return { done, total: slots.length, ratio: done / slots.length };
  }, [slots]);

  if (loading) {
    return (
      <View style={[techniqueScreenStyles.card, styles.weekLoading]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[techniqueScreenStyles.formHint, { marginTop: 8 }]}>
          {TEXTS.WEEK_LOADING}
        </Text>
      </View>
    );
  }

  if (!Array.isArray(slots) || slots.length === 0) {
    return (
      <View style={techniqueScreenStyles.card}>
        <Text style={techniqueScreenStyles.formHint}>{TEXTS.WEEK_EMPTY}</Text>
      </View>
    );
  }

  return (
    <View style={styles.weekRoot}>
      <View style={[techniqueScreenStyles.card, styles.weekIntroCard]}>
        <Text style={techniqueScreenStyles.formSectionHeading}>{TEXTS.WEEK_TITLE}</Text>
        <Text style={[techniqueScreenStyles.formHint, styles.weekIntroBody]}>
          {TEXTS.WEEK_BODY}
        </Text>
        {progress ? (
          <View style={styles.weekProgressBlock}>
            <View style={styles.weekProgressRow}>
              <Text style={[styles.weekProgressLabel, { color: colors.textSecondary }]}>
                {progress.done} / {progress.total}
              </Text>
              <Text style={[styles.weekProgressHint, { color: colors.textSecondary }]}>
                {TEXTS.WEEK_STATUS_COMPLETED}
              </Text>
            </View>
            <View style={[styles.weekProgressTrack, { backgroundColor: colors.glassFill }]}>
              <View
                style={[
                  styles.weekProgressFill,
                  {
                    width: `${Math.round(progress.ratio * 100)}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
          </View>
        ) : null}
      </View>

      {slots.map((slot) => {
        const status = slot?.status || 'planned';
        const statusKey = STATUS_LABEL_KEY[status] || STATUS_LABEL_KEY.planned;
        const dayLabel = dayLabels?.[slot?.dayOffset] || '—';
        const activityType = slot?.activityType === 'routine' ? 'routine' : 'pleasant';
        const typeMeta = TYPE_META[activityType];
        const isDone = status === 'completed' || status === 'skipped';
        const busy = savingSlotId === slot?.slotId;
        const accent = slotAccent(colors, activityType, status);

        return (
          <View
            key={slot.slotId}
            style={[
              styles.weekSlotCard,
              {
                backgroundColor: colors.cardBackground,
                borderColor: isDone ? 'transparent' : colors.border,
                opacity: status === 'skipped' ? 0.72 : 1,
              },
            ]}
          >
            <View style={styles.weekSlotTop}>
              <View style={[styles.weekDayBadge, { backgroundColor: `${accent}22` }]}>
                <Text style={[styles.weekDayBadgeText, { color: accent }]}>{dayLabel}</Text>
              </View>
              <View style={styles.weekSlotMain}>
                <View style={styles.weekChipRow}>
                  <View style={styles.weekChipLeft}>
                    <View style={[styles.weekTypeChip, { backgroundColor: colors.glassFill }]}>
                      <Ionicons name={typeMeta.icon} size={12} color={colors.textSecondary} />
                      <Text style={[styles.weekTypeChipText, { color: colors.textSecondary }]}>
                        {typeLabels[activityType]}
                      </Text>
                    </View>
                    {slot?.linkedTaskId ? (
                      <View style={[styles.weekLinkedChip, { backgroundColor: colors.glassFill }]}>
                        <Ionicons name="checkbox-outline" size={11} color={colors.primary} />
                        <Text style={[styles.weekLinkedChipText, { color: colors.primary }]}>
                          {TEXTS.WEEK_LINKED_TASK}
                        </Text>
                      </View>
                    ) : null}
                    {slot?.linkedHabitId ? (
                      <View style={[styles.weekLinkedChip, { backgroundColor: colors.glassFill }]}>
                        <Ionicons name="refresh-outline" size={11} color={colors.primary} />
                        <Text style={[styles.weekLinkedChipText, { color: colors.primary }]}>
                          {TEXTS.WEEK_LINKED_HABIT}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View
                    style={[
                      styles.weekStatusPill,
                      {
                        backgroundColor:
                          status === 'completed'
                            ? `${colors.primary}22`
                            : colors.glassFill,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.weekStatusText,
                        {
                          color:
                            status === 'completed' ? colors.primary : colors.textSecondary,
                        },
                      ]}
                    >
                      {TEXTS[statusKey]}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.weekActivity,
                    {
                      color: colors.text,
                      textDecorationLine: status === 'skipped' ? 'line-through' : 'none',
                    },
                  ]}
                >
                  {slot?.activityDescription}
                </Text>
              </View>
            </View>

            {status === 'completed' ? (
              <View style={styles.weekDoneRow}>
                <MaterialCommunityIcons name="check-circle" size={18} color={colors.primary} />
                <Text style={[styles.weekDoneText, { color: colors.primary }]}>
                  {TEXTS.WEEK_STATUS_COMPLETED}
                </Text>
              </View>
            ) : null}

            {!isDone ? (
              <View style={styles.weekActions}>
                <TouchableOpacity
                  style={[styles.weekActionPrimary, { backgroundColor: colors.primary }]}
                  onPress={() => onRegisterSlot(slot)}
                  disabled={busy}
                  accessibilityRole="button"
                  activeOpacity={0.85}
                >
                  {busy ? (
                    <ActivityIndicator size="small" color={colors.textOnPrimary} />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={16} color={colors.textOnPrimary} />
                      <Text style={[styles.weekActionText, { color: colors.textOnPrimary }]}>
                        {TEXTS.WEEK_REGISTER}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.weekActionSecondary, { borderColor: colors.border }]}
                  onPress={() => onSkipSlot(slot)}
                  disabled={busy}
                  accessibilityRole="button"
                  activeOpacity={0.75}
                >
                  <Text style={[styles.weekActionTextMuted, { color: colors.textSecondary }]}>
                    {TEXTS.WEEK_SKIP}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
