/**
 * Check-in de ánimo del home: chips + validación + CTAs de puente.
 */
import * as Haptics from 'expo-haptics';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import {
  fetchTodayMoodCheckIn,
  MOOD_OPTIONS,
  saveTodayMoodCheckIn,
} from '../../services/dailyMoodService';
import { createDashboardStyles } from '../../styles/dashboardTheme';
import { cacheTodayMoodPayload } from '../../utils/dailyMoodStorage';
import { buildMoodAckCopy } from '../../utils/dashboardHomeUtils';
import {
  isValidMoodCheckInKey,
  isValidMoodSecondaryAction,
  resolveMoodAcknowledgment,
  resolveMoodSecondaryAction,
  resolveMoodSuggestChat,
} from '../../utils/moodCheckInActions';

const MoodCheckInCard = memo(({
  onMoodSaved,
  displayName = '',
  syncedMood = null,
  focusFetchDone = false,
  focusPayload = null,
  onOpenChat,
  onSecondaryAction,
}) => {
  const DASH = useSectionTranslations('DASH');
  const { colors, resolvedScheme } = useTheme();
  const styles = useMemo(
    () => createDashboardStyles(colors, resolvedScheme),
    [colors, resolvedScheme],
  );
  const [checkIn, setCheckIn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!focusFetchDone) return;

      if (syncedMood !== undefined) {
        if (!cancelled) {
          setCheckIn(syncedMood);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      const remote = await fetchTodayMoodCheckIn();
      if (!cancelled) {
        setCheckIn(remote);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [focusFetchDone, syncedMood]);

  useEffect(() => {
    if (syncedMood?.mood && !checkIn?.mood) {
      setCheckIn(syncedMood);
    }
  }, [syncedMood?.mood, checkIn?.mood, syncedMood]);

  const labels = useMemo(
    () => ({
      calm: DASH.MOOD_CALM,
      anxious: DASH.MOOD_ANXIOUS,
      tired: DASH.MOOD_TIRED,
      good: DASH.MOOD_GOOD,
    }),
    [DASH],
  );

  const onSelect = useCallback(
    async (mood) => {
      if (saving) return;
      setSaving(true);
      setCheckIn((prev) => ({ ...(prev || {}), mood }));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

      const saved = await saveTodayMoodCheckIn(mood);
      if (saved) {
        setCheckIn(saved);
        onMoodSaved?.(saved);
      } else {
        await cacheTodayMoodPayload({ mood });
        setCheckIn({ mood });
      }
      setSaving(false);
    },
    [onMoodSaved, saving],
  );

  const moodAckFallback = useMemo(() => {
    if (!checkIn?.mood) return null;
    return buildMoodAckCopy({
      mood: checkIn.mood,
      displayName,
      dateKey: checkIn.dateKey,
      texts: DASH,
    });
  }, [checkIn?.mood, checkIn?.dateKey, displayName, DASH]);

  const acknowledgmentLine = useMemo(() => {
    if (!checkIn?.mood) return null;
    return resolveMoodAcknowledgment(checkIn, moodAckFallback?.line);
  }, [checkIn, moodAckFallback?.line]);

  const suggestChat = resolveMoodSuggestChat(checkIn);
  const secondary = useMemo(() => {
    const action = resolveMoodSecondaryAction({ checkIn, focus: focusPayload });
    return isValidMoodSecondaryAction(action) ? action : null;
  }, [checkIn, focusPayload]);
  const showActions = Boolean(checkIn?.mood) && !loading;
  const chatA11y =
    (suggestChat ? String(checkIn?.antoSnippet || '').trim() : '') || DASH.MOOD_OPEN_CHAT_CTA;
  const secondaryLabel = secondary?.labelKey ? DASH[secondary.labelKey] : null;

  const handleOpenChat = useCallback(() => {
    if (!onOpenChat) return;
    const mood = isValidMoodCheckInKey(checkIn?.mood) ? checkIn.mood : null;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onOpenChat(
      mood
        ? {
            fromMoodCheckIn: true,
            mood,
            chatEmotion: checkIn?.chatEmotion || null,
          }
        : null,
    );
  }, [onOpenChat, checkIn?.mood, checkIn?.chatEmotion]);

  const handleSecondary = useCallback(() => {
    if (!secondary || !onSecondaryAction) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSecondaryAction(secondary);
  }, [onSecondaryAction, secondary]);

  return (
    <View style={[styles.section, styles.surfaceCard]} accessibilityRole="summary">
      <Text style={styles.questionTitle}>{DASH.MOOD_QUESTION}</Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
      ) : (
        <View style={styles.moodRow}>
          {MOOD_OPTIONS.map((key) => {
            const isSelected = checkIn?.mood === key;
            return (
              <Pressable
                key={key}
                onPress={() => onSelect(key)}
                disabled={saving}
                style={({ pressed }) => [
                  styles.moodPill,
                  isSelected ? styles.moodPillSelected : styles.moodPillDefault,
                  pressed && { opacity: 0.88, transform: [{ scale: 0.97 }] },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={labels[key]}
              >
                <Text
                  style={[styles.moodPillText, isSelected && styles.moodPillTextSelected]}
                >
                  {labels[key]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {acknowledgmentLine ? (
        <Text style={styles.moodAckText} accessibilityRole="text">
          {acknowledgmentLine}
        </Text>
      ) : null}

      {showActions && onOpenChat ? (
        <View style={styles.moodActionRow}>
          <Pressable
            onPress={handleOpenChat}
            style={({ pressed }) => [
              styles.moodActionChip,
              suggestChat ? styles.moodActionChipPrimary : styles.moodActionChipSecondary,
              pressed && { opacity: 0.88 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={suggestChat ? chatA11y : DASH.MOOD_CTA_CHAT_SOFT}
          >
            <Text
              style={
                suggestChat
                  ? styles.moodActionChipTextPrimary
                  : styles.moodActionChipTextSecondary
              }
            >
              {suggestChat ? DASH.MOOD_OPEN_CHAT_CTA : DASH.MOOD_CTA_CHAT_SOFT}
            </Text>
          </Pressable>
          {secondary && secondaryLabel && onSecondaryAction ? (
            <Pressable
              onPress={handleSecondary}
              style={({ pressed }) => [
                styles.moodActionChip,
                styles.moodActionChipSecondary,
                pressed && { opacity: 0.88 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={secondaryLabel}
            >
              <Text style={styles.moodActionChipTextSecondary}>{secondaryLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
});

MoodCheckInCard.displayName = 'MoodCheckInCard';

export default MoodCheckInCard;
