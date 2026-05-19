/**
 * Bloque de estadísticas del perfil (tareas, hábitos, racha)
 */
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useProfileScreenStyles } from './profileScreenStyles';
import { STAT_ICON_SIZE, useProfileTexts } from './profileScreenConstants';

export function ProfileStats({ userData, detailedStats }) {
  const TEXTS = useProfileTexts();
  const { styles, profileColors } = useProfileScreenStyles();

  return (
    <View style={styles.statsContainer}>
      <Text style={styles.sectionTitle}>{TEXTS.STATS_TITLE}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsGrid}
      >
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="check-circle" size={STAT_ICON_SIZE} color={profileColors.PRIMARY} />
          <Text style={styles.statValue}>{userData.stats.tasksCompleted}</Text>
          <Text style={styles.statLabel}>{TEXTS.TASKS_COMPLETED}</Text>
          <Text style={styles.statSubLabel}>
            {detailedStats.tasksThisWeek} {TEXTS.THIS_WEEK}
          </Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="lightning-bolt" size={STAT_ICON_SIZE} color={profileColors.STAT_ICON_HABITS} />
          <Text style={styles.statValue}>{detailedStats.habitsActive}</Text>
          <Text style={styles.statLabel}>{TEXTS.HABITS_ACTIVE}</Text>
          <Text style={styles.statSubLabel}>
            {detailedStats.habitsCompleted} {TEXTS.COMPLETED_TODAY}
          </Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="fire" size={STAT_ICON_SIZE} color={profileColors.STAT_ICON_STREAK} />
          <Text style={styles.statValue}>{userData.stats.habitsStreak}</Text>
          <Text style={styles.statLabel}>{TEXTS.CURRENT_STREAK}</Text>
          <Text style={styles.statSubLabel}>
            {TEXTS.BEST}: {detailedStats.bestStreak} {TEXTS.DAYS}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
