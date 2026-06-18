import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { memo, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { createDashboardStyles } from '../../styles/dashboardTheme';
import { pickAntoPromptFromFocus } from '../../utils/dashboardHomeUtils';

const DashboardAntoPromptCard = memo(({ focusPayload, onOpenChat, onOpenConversation }) => {
  const DASH = useSectionTranslations('DASH');
  const { colors, resolvedScheme } = useTheme();
  const styles = useMemo(
    () => createDashboardStyles(colors, resolvedScheme),
    [colors, resolvedScheme],
  );
  const prompt = useMemo(() => pickAntoPromptFromFocus(focusPayload), [focusPayload]);

  if (focusPayload?.dailyMood?.suggestChat) {
    return null;
  }

  if (!prompt) return null;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (prompt.conversationId && onOpenConversation) {
      onOpenConversation(prompt.conversationId);
      return;
    }
    onOpenChat?.();
  };

  return (
    <View style={[styles.section, styles.surfaceCard]}>
      <View style={styles.antoRow}>
        <View style={styles.antoAvatar}>
          <Ionicons name="chatbubble-ellipses" size={22} color={colors.primary} />
        </View>
        <View style={styles.antoCopy}>
          <Text style={styles.antoName}>{prompt.title}</Text>
          <Text style={styles.antoSnippet} numberOfLines={2}>
            {prompt.snippet}
          </Text>
        </View>
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [styles.antoCta, pressed && { opacity: 0.88 }]}
          accessibilityRole="button"
          accessibilityLabel={DASH.ANTO_PROMPT_CONTINUE}
        >
          <Text style={styles.antoCtaText}>{DASH.ANTO_PROMPT_CONTINUE}</Text>
        </Pressable>
      </View>
    </View>
  );
});

DashboardAntoPromptCard.displayName = 'DashboardAntoPromptCard';

export default DashboardAntoPromptCard;
