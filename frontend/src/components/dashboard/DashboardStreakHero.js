import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { memo, useEffect, useMemo, useRef } from 'react';
import { View, Text, Pressable, Animated, Easing } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { createDashboardStyles } from '../../styles/dashboardTheme';
import { buildStreakHeroCopy } from '../../utils/dashboardHomeUtils';
import {
  buildStreakCardMetaLine,
  resolveStreakUnitLabel,
} from '../../utils/dashboardStreakCardUtils';
import { getStreakVisual } from '../../utils/streakVisualUtils';

const DashboardStreakHero = memo(({ streakDays, displayName, dailyMood, onOpenChat, streakOnly = false }) => {
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

  const orbPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!streakVisual.pulse) {
      orbPulse.setValue(1);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(orbPulse, {
          toValue: 1.12,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orbPulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [streakVisual.pulse, orbPulse]);

  const copy = useMemo(
    () =>
      buildStreakHeroCopy({
        streakDays,
        displayName,
        dailyMood,
        texts: DASH,
      }),
    [streakDays, displayName, dailyMood, DASH],
  );

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onOpenChat?.();
  };

  const tierBadge = streakVisual.labelKey ? DASH[streakVisual.labelKey] : null;
  const streakChipLabel =
    streakDays === 1
      ? DASH.STREAK_CHIP_ONE || `1 ${DASH.STAT_STREAK_DAYS}`
      : (DASH.STREAK_CHIP_DAYS || '{days} {label}')
          .replace('{days}', String(streakDays))
          .replace('{label}', DASH.STAT_STREAK_DAYS || '');

  const streakUnitLabel = resolveStreakUnitLabel(streakDays, DASH);

  const streakMetaLine = buildStreakCardMetaLine({
    tierBadge,
    nudge: DASH.STREAK_CARD_NUDGE,
    fallbackSubtitle: copy.subtitle,
  });

  const gradientLayers = (
    <>
      <View
        style={[styles.heroGradientBase, { backgroundColor: streakVisual.heroGradientTop }]}
        pointerEvents="none"
      />
      <View
        style={[
          styles.heroGradientFade,
          { backgroundColor: streakVisual.heroGradientBottom },
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.heroOrb,
          {
            backgroundColor: streakVisual.orbColor,
            transform: [{ scale: orbPulse }],
          },
        ]}
        pointerEvents="none"
      />
    </>
  );

  if (streakOnly) {
    if (streakDays <= 0) return null;

    return (
      <View
        style={[styles.heroCard, styles.heroCardStreakOnly]}
        accessibilityRole="text"
        accessibilityLabel={streakChipLabel}
      >
        {gradientLayers}
        <View style={styles.heroStreakDynamicRow}>
          <View style={styles.heroStreakIconWrap}>
            <Ionicons name="sparkles" size={22} color={streakVisual.sparkleColor} />
          </View>
          <View style={styles.heroStreakCopy}>
            <View style={styles.heroStreakMainLine}>
              <Text style={styles.heroStreakNumber}>{streakDays}</Text>
              <Text style={styles.heroStreakUnit}>{streakUnitLabel}</Text>
            </View>
            <Text style={styles.heroStreakMeta} numberOfLines={2}>
              {streakMetaLine}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.heroCard,
        { backgroundColor: streakVisual.heroBackground },
        pressed && { opacity: 0.96 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${copy.title}. ${copy.subtitle}. ${DASH.STREAK_HERO_CTA}`}
    >
      <Animated.View
        style={[
          styles.heroOrb,
          {
            backgroundColor: streakVisual.orbColor,
            transform: [{ scale: orbPulse }],
          },
        ]}
        pointerEvents="none"
      />
      {streakDays > 0 ? (
        <View style={styles.heroStreakChip} accessibilityRole="text">
          <Ionicons name={streakVisual.icon} size={15} color={colors.white} />
          <Text style={styles.heroStreakChipText}>{streakChipLabel}</Text>
          {tierBadge ? (
            <>
              <Text style={styles.heroStreakChipSep}>·</Text>
              <Text style={styles.heroStreakChipTier}>{tierBadge}</Text>
            </>
          ) : null}
        </View>
      ) : null}
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
