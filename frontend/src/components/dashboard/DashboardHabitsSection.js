import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { memo, useCallback, useMemo } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { api, ENDPOINTS } from '../../config/api';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { createDashboardStyles } from '../../styles/dashboardTheme';
import { formatHabitRowMeta, getActiveHabitsForDashboard } from '../../utils/dashboardHomeUtils';
import { resolveHabitMaterialIcon } from '../../screens/habits/habitsScreenConstants';

const DashboardHabitsSection = memo(({ habits, onUpdate, togglingId }) => {
  const navigation = useNavigation();
  const DASH = useSectionTranslations('DASH');
  const HABITS = useSectionTranslations('HABITS');
  const { colors, resolvedScheme } = useTheme();
  const styles = useMemo(
    () => createDashboardStyles(colors, resolvedScheme),
    [colors, resolvedScheme],
  );

  const todayHabits = useMemo(() => {
    const active = getActiveHabitsForDashboard(habits);
    const pendingFirst = [...active].sort((a, b) => {
      const aDone = a.status?.completedToday ? 1 : 0;
      const bDone = b.status?.completedToday ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      return (b.progress?.streak || 0) - (a.progress?.streak || 0);
    });
    return pendingFirst.slice(0, 4);
  }, [habits]);

  const texts = useMemo(
    () => ({
      HABIT_META_COMPLETED_STREAK: DASH.HABIT_META_COMPLETED_STREAK,
      HABIT_META_COMPLETED_TODAY: DASH.HABIT_META_COMPLETED_TODAY,
      HABIT_META_PENDING: DASH.HABIT_META_PENDING,
    }),
    [DASH],
  );

  const handleToggle = useCallback(
    async (habitId) => {
      if (togglingId) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      try {
        await api.patch(`${ENDPOINTS.HABIT_BY_ID(habitId)}/toggle`, {});
        onUpdate?.(habitId);
      } catch {
        /* el padre puede reintentar con pull-to-refresh */
      }
    },
    [onUpdate, togglingId],
  );

  if (!todayHabits.length) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>{DASH.HABITS_TODAY_TITLE}</Text>
        <Pressable
          onPress={() => navigation.navigate('Habits')}
          accessibilityRole="button"
          accessibilityLabel={DASH.HABITS_VIEW_ALL}
        >
          <Text style={styles.sectionLink}>{DASH.HABITS_VIEW_ALL}</Text>
        </Pressable>
      </View>
      <View style={styles.groupedCard}>
        {todayHabits.map((habit, index) => {
          const isLast = index === todayHabits.length - 1;
          const completed = habit.status?.completedToday;
          const isToggling = togglingId === habit._id;

          return (
            <View
              key={habit._id || habit.id}
              style={[styles.groupedRow, !isLast && styles.groupedRowBorder]}
            >
              <View style={styles.rowIcon}>
                <MaterialCommunityIcons
                  name={resolveHabitMaterialIcon(habit.icon, 'lightning-bolt')}
                  size={22}
                  color={colors.primary}
                />
              </View>
              <Pressable
                style={styles.rowCopy}
                onPress={() => navigation.navigate('Habits', { habitId: habit._id })}
                accessibilityRole="button"
                accessibilityLabel={habit.title}
              >
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {habit.title}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {formatHabitRowMeta(habit, texts)}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleToggle(habit._id)}
                style={styles.checkButton}
                disabled={isToggling}
                accessibilityRole="button"
                accessibilityLabel={
                  completed ? HABITS.STATUS_COMPLETED_A11Y : HABITS.STATUS_PENDING_A11Y
                }
              >
                {isToggling ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <MaterialCommunityIcons
                    name={completed ? 'check-circle' : 'circle-outline'}
                    size={28}
                    color={completed ? colors.primary : colors.textMuted}
                  />
                )}
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
});

DashboardHabitsSection.displayName = 'DashboardHabitsSection';

export default DashboardHabitsSection;
