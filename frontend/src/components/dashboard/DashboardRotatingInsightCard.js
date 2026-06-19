import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { memo, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { createDashboardStyles } from '../../styles/dashboardTheme';
import { CHAT_BACK_TARGET } from '../../navigation/navigationHelpers';
import { mapServerHomeInsight } from '../../utils/mapServerHomeInsight';

const DashboardRotatingInsightCard = memo(({ insight: serverInsight = null }) => {
  const navigation = useNavigation();
  const DASH = useSectionTranslations('DASH');
  const { colors, resolvedScheme } = useTheme();
  const styles = useMemo(
    () => createDashboardStyles(colors, resolvedScheme),
    [colors, resolvedScheme],
  );

  const insight = useMemo(
    () => mapServerHomeInsight(serverInsight, DASH),
    [serverInsight, DASH],
  );

  const onPress = () => {
    if (!insight?.screen) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (insight.screen === 'Chat') {
      navigation.navigate('Chat', { chatBackTarget: CHAT_BACK_TARGET.DASH });
      return;
    }
    navigation.navigate(insight.screen);
  };

  if (!insight?.text) return null;

  const isWelcome = insight.variant === 'welcome';
  const sectionTitle = insight.sectionLabel || DASH.HOME_INSIGHT_SECTION;
  const iconName = isWelcome ? 'hand-heart' : 'chart-line';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.section,
        styles.surfaceCard,
        styles.homeInsightCard,
        pressed && { opacity: 0.92 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${sectionTitle}. ${insight.text}. ${insight.ctaLabel}`}
    >
      <Text style={styles.eyebrow}>{sectionTitle}</Text>
      <View style={styles.homeInsightRow}>
        <View style={styles.homeInsightIconWrap}>
          <MaterialCommunityIcons name={iconName} size={20} color={colors.primary} />
        </View>
        <View style={styles.homeInsightCopy}>
          <Text style={styles.homeInsightText}>{insight.text}</Text>
          <Text style={styles.homeInsightCta}>
            {insight.ctaLabel}
            {' →'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});

DashboardRotatingInsightCard.displayName = 'DashboardRotatingInsightCard';

export default DashboardRotatingInsightCard;
