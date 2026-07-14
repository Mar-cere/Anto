/**
 * Check-in de ánimo del home: chips + CTAs; colapsa tras el ritual de sesión.
 */
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  getDashboardSessionId,
  getMoodCheckInUiState,
  markMoodCheckInCollapsed,
  markMoodCheckInExpanded,
  MOOD_CHECKIN_AUTO_COLLAPSE_MS,
  shouldExpandMoodCheckInOnMount,
} from '../../utils/dashboardSession';
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
  const [expanded, setExpanded] = useState(true);
  const seededExpandRef = useRef(false);
  const autoCollapseTimerRef = useRef(null);

  const clearAutoCollapse = useCallback(() => {
    if (autoCollapseTimerRef.current) {
      clearTimeout(autoCollapseTimerRef.current);
      autoCollapseTimerRef.current = null;
    }
  }, []);

  const collapse = useCallback(() => {
    clearAutoCollapse();
    markMoodCheckInCollapsed();
    setExpanded(false);
  }, [clearAutoCollapse]);

  const expand = useCallback(() => {
    clearAutoCollapse();
    markMoodCheckInExpanded();
    setExpanded(true);
  }, [clearAutoCollapse]);

  const scheduleAutoCollapse = useCallback(() => {
    clearAutoCollapse();
    autoCollapseTimerRef.current = setTimeout(() => {
      markMoodCheckInCollapsed();
      setExpanded(false);
      autoCollapseTimerRef.current = null;
    }, MOOD_CHECKIN_AUTO_COLLAPSE_MS);
  }, [clearAutoCollapse]);

  useEffect(() => () => clearAutoCollapse(), [clearAutoCollapse]);

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

  // Sembrar expandido/colapsado al resolver el ánimo (respira solo en sesión nueva).
  useEffect(() => {
    if (loading) return;
    const hasMood = isValidMoodCheckInKey(checkIn?.mood);
    if (!hasMood) {
      seededExpandRef.current = false;
      setExpanded(true);
      return;
    }
    if (seededExpandRef.current) return;
    seededExpandRef.current = true;
    const sessionId = getDashboardSessionId();
    const nextExpanded = shouldExpandMoodCheckInOnMount({
      hasMood: true,
      sessionId,
      state: getMoodCheckInUiState(),
    });
    setExpanded(nextExpanded);
    if (nextExpanded) markMoodCheckInExpanded();
  }, [loading, checkIn?.mood]);

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
      setExpanded(true);
      markMoodCheckInExpanded();
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
      scheduleAutoCollapse();
    },
    [onMoodSaved, saving, scheduleAutoCollapse],
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
  const showActions = Boolean(checkIn?.mood) && !loading && expanded;
  const chatA11y =
    (suggestChat ? String(checkIn?.antoSnippet || '').trim() : '') || DASH.MOOD_OPEN_CHAT_CTA;
  const secondaryLabel = secondary?.labelKey ? DASH[secondary.labelKey] : null;

  const hasMood = isValidMoodCheckInKey(checkIn?.mood);
  const showCollapsed = !loading && hasMood && !expanded;
  const moodLabel = hasMood ? labels[checkIn.mood] : '';
  const collapsedToday = String(DASH.MOOD_COLLAPSED_TODAY || 'Hoy: {mood}').replace(
    '{mood}',
    moodLabel,
  );

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

  const handleToggleCollapsed = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (expanded) collapse();
    else expand();
  }, [expanded, collapse, expand]);

  if (showCollapsed) {
    return (
      <View style={[styles.section, styles.surfaceCard]} accessibilityRole="summary">
        <Pressable
          onPress={handleToggleCollapsed}
          style={({ pressed }) => [
            styles.moodCollapsedRow,
            pressed && { opacity: 0.88 },
          ]}
          accessibilityRole="button"
          accessibilityState={{ expanded: false }}
          accessibilityLabel={DASH.MOOD_EXPAND_A11Y}
        >
          <View style={styles.moodCollapsedTextCol}>
            <Text style={styles.moodCollapsedLabel} numberOfLines={1}>
              {collapsedToday}
            </Text>
            <Text style={styles.moodCollapsedHint}>{DASH.MOOD_COLLAPSED_HINT}</Text>
          </View>
          <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.section, styles.surfaceCard]} accessibilityRole="summary">
      <View style={styles.moodExpandedHeader}>
        <Text style={[styles.questionTitle, styles.moodExpandedTitle]}>{DASH.MOOD_QUESTION}</Text>
        {hasMood ? (
          <Pressable
            onPress={handleToggleCollapsed}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityState={{ expanded: true }}
            accessibilityLabel={DASH.MOOD_COLLAPSE_A11Y}
            style={({ pressed }) => [
              styles.moodCollapseIconBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="chevron-up" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

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
