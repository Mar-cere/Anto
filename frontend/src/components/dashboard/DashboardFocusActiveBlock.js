import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { useToast } from '../../context/ToastContext';
import { CUSTOM_GOAL_MAX_LEN, normalizeCustomGoal } from '../../utils/customGoalUtils';

/**
 * Bloque de foco activo: cabecera, objetivo editable y barra de progreso.
 */
export default function DashboardFocusActiveBlock({
  activeFocus,
  hasActiveFocus,
  FOCUS_PROGRESS,
  colors,
  styles,
  onOpenFocusProgress,
  onOpenFocusOnboarding,
  onSaveCustomGoal,
  showStartFocusCta,
}) {
  const { showToast } = useToast();
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);

  const activeFocusKey = `${activeFocus?.themeId || ''}|${activeFocus?.customGoal ?? ''}`;
  const prevFocusKeyRef = useRef(activeFocusKey);

  useEffect(() => {
    if (!hasActiveFocus && editingGoal) {
      setEditingGoal(false);
      setGoalDraft('');
    }
  }, [hasActiveFocus, editingGoal]);

  useEffect(() => {
    if (editingGoal && !savingGoal && prevFocusKeyRef.current !== activeFocusKey) {
      setEditingGoal(false);
      setGoalDraft('');
    }
    prevFocusKeyRef.current = activeFocusKey;
  }, [activeFocusKey, editingGoal, savingGoal]);

  const beginEditGoal = useCallback(() => {
    if (!onSaveCustomGoal) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setGoalDraft(String(activeFocus?.customGoal || ''));
    setEditingGoal(true);
  }, [onSaveCustomGoal, activeFocus?.customGoal]);

  const cancelEditGoal = useCallback(() => {
    setEditingGoal(false);
    setGoalDraft('');
  }, []);

  const saveGoal = useCallback(async () => {
    if (!onSaveCustomGoal || savingGoal) return;
    setSavingGoal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      await onSaveCustomGoal(normalizeCustomGoal(goalDraft));
      setEditingGoal(false);
      setGoalDraft('');
    } catch (_) {
      showToast({ message: FOCUS_PROGRESS.GOAL_SAVE_ERROR, type: 'error' });
    } finally {
      setSavingGoal(false);
    }
  }, [onSaveCustomGoal, savingGoal, goalDraft, showToast, FOCUS_PROGRESS.GOAL_SAVE_ERROR]);

  if (hasActiveFocus) {
    return (
      <View style={styles.activeFocusContainer}>
        <Pressable
          onPress={onOpenFocusProgress ? () => onOpenFocusProgress(activeFocus) : null}
          disabled={!onOpenFocusProgress}
          style={({ pressed }) => [pressed && onOpenFocusProgress && { opacity: 0.9 }]}
          accessibilityRole={onOpenFocusProgress ? 'button' : 'text'}
          accessibilityLabel={`${activeFocus.themeName}, ${FOCUS_PROGRESS.WEEK_LABEL.replace('{current}', activeFocus.weekNumber).replace('{total}', activeFocus.durationWeeks)}`}
        >
          <View style={styles.activeFocusHeader}>
            <View style={styles.activeFocusIconWrap}>
              <Ionicons name={activeFocus.icon || 'flag-outline'} size={20} color={colors.primary} />
            </View>
            <View style={styles.activeFocusTitleRow}>
              <Text style={styles.activeFocusTheme} numberOfLines={1}>
                {activeFocus.themeName}
              </Text>
              <Text style={styles.activeFocusWeek} numberOfLines={1}>
                {FOCUS_PROGRESS.WEEK_LABEL
                  .replace('{current}', String(activeFocus.weekNumber))
                  .replace('{total}', String(activeFocus.durationWeeks))}
              </Text>
            </View>
            {onOpenFocusProgress ? (
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            ) : null}
          </View>
        </Pressable>

        <View style={styles.activeFocusGoalBlock}>
          <Text style={styles.activeFocusGoalEyebrow}>{FOCUS_PROGRESS.CUSTOM_GOAL}</Text>
          {editingGoal ? (
            <>
              <TextInput
                style={styles.activeFocusGoalInput}
                value={goalDraft}
                onChangeText={setGoalDraft}
                placeholder={FOCUS_PROGRESS.GOAL_PLACEHOLDER}
                placeholderTextColor={colors.textMuted}
                maxLength={CUSTOM_GOAL_MAX_LEN}
                multiline
                editable={!savingGoal}
                accessibilityLabel={FOCUS_PROGRESS.CUSTOM_GOAL}
              />
              <View style={styles.activeFocusGoalActions}>
                <Pressable
                  onPress={saveGoal}
                  disabled={savingGoal}
                  style={({ pressed }) => [styles.commitmentChip, pressed && { opacity: 0.88 }]}
                  accessibilityRole="button"
                  accessibilityLabel={
                    savingGoal ? FOCUS_PROGRESS.GOAL_SAVING_A11Y : FOCUS_PROGRESS.GOAL_SAVE
                  }
                  accessibilityState={{ disabled: savingGoal, busy: savingGoal }}
                >
                  {savingGoal ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={styles.commitmentChipText}>{FOCUS_PROGRESS.GOAL_SAVE}</Text>
                  )}
                </Pressable>
                <Pressable
                  onPress={cancelEditGoal}
                  disabled={savingGoal}
                  style={({ pressed }) => [styles.commitmentChip, pressed && { opacity: 0.88 }]}
                  accessibilityRole="button"
                  accessibilityLabel={FOCUS_PROGRESS.GOAL_CANCEL}
                >
                  <Text style={styles.commitmentChipText}>{FOCUS_PROGRESS.GOAL_CANCEL}</Text>
                </Pressable>
              </View>
            </>
          ) : activeFocus.customGoal ? (
            <Pressable
              onPress={onSaveCustomGoal ? beginEditGoal : undefined}
              disabled={!onSaveCustomGoal}
              accessibilityRole={onSaveCustomGoal ? 'button' : 'text'}
              accessibilityLabel={
                onSaveCustomGoal ? FOCUS_PROGRESS.GOAL_EDIT_A11Y : activeFocus.customGoal
              }
              style={({ pressed }) => [pressed && onSaveCustomGoal && { opacity: 0.88 }]}
            >
              <Text style={styles.activeFocusGoal} numberOfLines={3}>
                {activeFocus.customGoal}
              </Text>
              {onSaveCustomGoal ? (
                <Text style={styles.activeFocusGoalHint}>{FOCUS_PROGRESS.GOAL_EDIT_HINT}</Text>
              ) : null}
            </Pressable>
          ) : onSaveCustomGoal ? (
            <Pressable
              onPress={beginEditGoal}
              accessibilityRole="button"
              accessibilityLabel={FOCUS_PROGRESS.GOAL_EMPTY_CTA}
              style={({ pressed }) => [pressed && { opacity: 0.88 }]}
            >
              <Text style={styles.activeFocusGoalEmpty}>{FOCUS_PROGRESS.GOAL_EMPTY_CTA}</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.activeFocusProgressContainer}>
          <View style={styles.activeFocusProgressTrack}>
            <View
              style={[
                styles.activeFocusProgressFill,
                { width: `${activeFocus.progress || 0}%` },
              ]}
            />
          </View>
          <Text style={styles.activeFocusProgressLabel}>{activeFocus.progress || 0}%</Text>
        </View>
      </View>
    );
  }

  if (showStartFocusCta) {
    return (
      <Pressable
        onPress={onOpenFocusOnboarding}
        style={({ pressed }) => [styles.activeFocusStartBlock, pressed && { opacity: 0.88 }]}
        accessibilityRole="button"
        accessibilityLabel={FOCUS_PROGRESS.GOAL_START_CTA}
      >
        <Text style={styles.activeFocusStartHint}>{FOCUS_PROGRESS.GOAL_START_HINT}</Text>
        <Text style={styles.activeFocusStartCta}>{FOCUS_PROGRESS.GOAL_START_CTA}</Text>
      </Pressable>
    );
  }

  return null;
}
