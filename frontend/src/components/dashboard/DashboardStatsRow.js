import React, { memo, useMemo } from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { createDashboardStyles } from '../../styles/dashboardTheme';

const DashboardStatsRow = memo(({ streakDays, habitsThisWeek }) => {
  const DASH = useSectionTranslations('DASH');
  const { colors, resolvedScheme } = useTheme();
  const styles = useMemo(
    () => createDashboardStyles(colors, resolvedScheme),
    [colors, resolvedScheme],
  );

  return (
    <View style={styles.statsRow} accessibilityRole="summary">
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{streakDays}</Text>
        <Text style={styles.statLabel}>{DASH.STAT_STREAK_DAYS}</Text>
        <View style={styles.statAccent} />
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{habitsThisWeek}</Text>
        <Text style={styles.statLabel}>{DASH.STAT_HABITS_WEEK}</Text>
        <View style={[styles.statAccent, { backgroundColor: colors.accentWarm }]} />
      </View>
    </View>
  );
});

DashboardStatsRow.displayName = 'DashboardStatsRow';

export default DashboardStatsRow;
