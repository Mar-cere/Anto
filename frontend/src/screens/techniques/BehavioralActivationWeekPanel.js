/**
 * Panel del plan semanal de activación conductual (#88).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

const STATUS_LABEL_KEY = {
  planned: 'WEEK_STATUS_PLANNED',
  completed: 'WEEK_STATUS_COMPLETED',
  skipped: 'WEEK_STATUS_SKIPPED',
};

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
    <View style={techniqueScreenStyles.card}>
      <Text style={techniqueScreenStyles.formSectionHeading}>{TEXTS.WEEK_TITLE}</Text>
      <Text style={[techniqueScreenStyles.formHint, { marginBottom: 12 }]}>
        {TEXTS.WEEK_BODY}
      </Text>
      {slots.map((slot) => {
        const status = slot?.status || 'planned';
        const statusKey = STATUS_LABEL_KEY[status] || STATUS_LABEL_KEY.planned;
        const dayLabel = dayLabels?.[slot?.dayOffset] || '';
        const isDone = status === 'completed' || status === 'skipped';
        const busy = savingSlotId === slot?.slotId;

        return (
          <View key={slot.slotId} style={styles.weekSlot}>
            <View style={styles.weekSlotHeader}>
              <Text style={styles.weekDay}>{dayLabel}</Text>
              <View
                style={[
                  styles.weekStatusPill,
                  {
                    backgroundColor:
                      status === 'completed'
                        ? colors.accentLineSoft
                        : status === 'skipped'
                          ? colors.glassFill
                          : colors.glassFill,
                  },
                ]}
              >
                <Text style={[styles.weekStatusText, { color: colors.textSecondary }]}>
                  {TEXTS[statusKey]}
                </Text>
              </View>
            </View>
            <Text style={[techniqueScreenStyles.formHint, styles.weekType]}>
              {typeLabels[slot?.activityType] || typeLabels.pleasant}
            </Text>
            <Text style={[techniqueScreenStyles.introText, styles.weekActivity]}>
              {slot?.activityDescription}
            </Text>
            {!isDone ? (
              <View style={styles.weekActions}>
                <TouchableOpacity
                  style={[styles.weekActionPrimary, { backgroundColor: colors.primary }]}
                  onPress={() => onRegisterSlot(slot)}
                  disabled={busy}
                  accessibilityRole="button"
                >
                  <Text style={[styles.weekActionText, { color: colors.textOnPrimary }]}>
                    {TEXTS.WEEK_REGISTER}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.weekActionSecondary, { borderColor: colors.border }]}
                  onPress={() => onSkipSlot(slot)}
                  disabled={busy}
                  accessibilityRole="button"
                >
                  <Text style={[styles.weekActionTextMuted, { color: colors.textSecondary }]}>
                    {TEXTS.WEEK_SKIP}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : status === 'completed' ? (
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={20}
                color={colors.primary}
                style={styles.weekDoneIcon}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
