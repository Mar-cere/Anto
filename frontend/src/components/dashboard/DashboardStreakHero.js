import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { memo, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { createDashboardStyles } from '../../styles/dashboardTheme';

const DashboardStreakHero = memo(({ streakDays, onOpenChat }) => {
  const DASH = useSectionTranslations('DASH');
  const { colors, resolvedScheme } = useTheme();
  const styles = useMemo(
    () => createDashboardStyles(colors, resolvedScheme),
    [colors, resolvedScheme],
  );

  const copy = useMemo(() => {
    if (streakDays >= 2) {
      return {
        title: DASH.STREAK_HERO_TITLE.replace('{days}', String(streakDays)),
        subtitle: DASH.STREAK_HERO_SUBTITLE_ACTIVE,
      };
    }
    if (streakDays === 1) {
      return {
        title: DASH.STREAK_HERO_TITLE_ONE,
        subtitle: DASH.STREAK_HERO_SUBTITLE_START,
      };
    }
    return {
      title: DASH.STREAK_HERO_TITLE_ZERO,
      subtitle: DASH.STREAK_HERO_SUBTITLE_ZERO,
    };
  }, [streakDays, DASH]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onOpenChat?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.heroCard, pressed && { opacity: 0.96 }]}
      accessibilityRole="button"
      accessibilityLabel={`${copy.title}. ${copy.subtitle}. ${DASH.STREAK_HERO_CTA}`}
    >
      <View style={styles.heroOrb} pointerEvents="none" />
      <Text style={styles.heroTitle}>{copy.title}</Text>
      <Text style={styles.heroSubtitle}>{copy.subtitle}</Text>
      <View style={styles.heroCta}>
        <Ionicons name="chatbubble-outline" size={17} color={colors.white} style={{ marginRight: 8 }} />
        <Text style={styles.heroCtaText}>{DASH.STREAK_HERO_CTA}</Text>
      </View>
    </Pressable>
  );
});

DashboardStreakHero.displayName = 'DashboardStreakHero';

export default DashboardStreakHero;
