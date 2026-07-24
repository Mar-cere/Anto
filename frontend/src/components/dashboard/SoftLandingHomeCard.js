/**
 * Línea calmada en home durante soft landing post-crisis (#225).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { memo, useMemo } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { createDashboardStyles } from '../../styles/dashboardTheme';
import { normalizeSoftLandingFocus } from '../../utils/softLandingPostCrisis';

const SoftLandingHomeCard = memo(({ softLanding = null }) => {
  const DASH = useSectionTranslations('DASH');
  const CHAT = useSectionTranslations('CHAT');
  const { colors, resolvedScheme } = useTheme();
  const styles = useMemo(
    () => createDashboardStyles(colors, resolvedScheme),
    [colors, resolvedScheme],
  );

  const payload = useMemo(() => normalizeSoftLandingFocus(softLanding), [softLanding]);
  if (!payload?.active) return null;

  const message =
    payload.message ||
    CHAT?.SOFT_LANDING_HOME_MESSAGE ||
    DASH?.SOFT_LANDING_HOME_MESSAGE ||
    '';

  if (!message) return null;

  return (
    <View
      style={[styles.section, styles.surfaceCard]}
      accessibilityRole="text"
      accessibilityLabel={message}
    >
      <View style={styles.homeInsightRow}>
        <View style={styles.homeInsightIconWrap}>
          <MaterialCommunityIcons name="hand-heart" size={20} color={colors.primary} />
        </View>
        <View style={styles.homeInsightCopy}>
          <Text style={styles.homeInsightText}>{message}</Text>
        </View>
      </View>
    </View>
  );
});

SoftLandingHomeCard.displayName = 'SoftLandingHomeCard';

export default SoftLandingHomeCard;
