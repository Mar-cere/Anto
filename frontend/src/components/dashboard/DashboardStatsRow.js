import { Ionicons } from '@expo/vector-icons';
import React, { memo, useEffect, useMemo, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { createDashboardStyles } from '../../styles/dashboardTheme';
import { getStreakVisual } from '../../utils/streakVisualUtils';

const DashboardStatsRow = memo(({
  streakDays,
  habitsThisWeek,
  showHabitsStat = true,
  showStreakStat = false,
}) => {
  const DASH = useSectionTranslations('DASH');
  const { colors, resolvedScheme } = useTheme();
  const styles = useMemo(
    () => createDashboardStyles(colors, resolvedScheme),
    [colors, resolvedScheme],
  );
  const streakVisual = useMemo(
    () => getStreakVisual(streakDays, colors, resolvedScheme),
    [streakDays, colors, resolvedScheme],
  );

  const pulse = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    if (!streakVisual.pulse) {
      pulse.setValue(1);
      glow.setValue(0.35);
      return undefined;
    }

    const scaleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 0.75,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0.35,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    scaleLoop.start();
    glowLoop.start();
    return () => {
      scaleLoop.stop();
      glowLoop.stop();
    };
  }, [streakVisual.pulse, pulse, glow]);

  const tierLabel = streakVisual.labelKey ? DASH[streakVisual.labelKey] : null;

  if (!showStreakStat && !showHabitsStat) {
    return null;
  }

  return (
    <View style={styles.statsRow} accessibilityRole="summary">
      {showStreakStat ? (
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: streakVisual.surface,
              borderColor: streakVisual.glow,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Animated.View style={{ transform: [{ scale: pulse }] }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: streakVisual.glow,
                }}
              >
                <Ionicons name={streakVisual.icon} size={20} color={streakVisual.accent} />
              </View>
            </Animated.View>
            <Text style={[styles.statValue, { color: streakVisual.accent }]}>{streakDays}</Text>
          </View>
          <Text style={styles.statLabel}>{DASH.STAT_STREAK_DAYS}</Text>
          {tierLabel ? (
            <Text style={[styles.statTierLabel, { color: streakVisual.accent }]}>{tierLabel}</Text>
          ) : null}
          <Animated.View
            style={[
              styles.statAccent,
              {
                backgroundColor: streakVisual.accent,
                opacity: glow,
                width: streakVisual.tier === 'legend' ? 48 : streakVisual.tier === 'none' ? 28 : 36,
              },
            ]}
          />
        </View>
      ) : null}
      {showHabitsStat ? (
        <View style={[styles.statCard, !showStreakStat && styles.statCardSolo]}>
          <Text style={styles.statValue}>{habitsThisWeek}</Text>
          <Text style={styles.statLabel}>{DASH.STAT_HABITS_WEEK}</Text>
          <View style={[styles.statAccent, { backgroundColor: colors.accentWarm }]} />
        </View>
      ) : null}
    </View>
  );
});

DashboardStatsRow.displayName = 'DashboardStatsRow';

export default DashboardStatsRow;
