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

const MoodCheckInCard = memo(({ onMoodSaved, displayName = '', syncedMood = null }) => {
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
  }, []);

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

  const moodAck = useMemo(() => {
    if (!checkIn?.mood) return null;
    return buildMoodAckCopy({
      mood: checkIn.mood,
      displayName,
      dateKey: checkIn.dateKey,
      texts: DASH,
    });
  }, [checkIn?.mood, checkIn?.dateKey, displayName, DASH]);

  return (
    <View style={[styles.section, styles.surfaceCard]} accessibilityRole="summary">
      <Text style={styles.eyebrow}>{DASH.MOOD_SECTION_LABEL}</Text>
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

      {moodAck?.line ? (
        <Text style={styles.moodAckText} accessibilityRole="text">
          {moodAck.line}
        </Text>
      ) : null}
    </View>
  );
});

MoodCheckInCard.displayName = 'MoodCheckInCard';

export default MoodCheckInCard;
