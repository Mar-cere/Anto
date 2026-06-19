/**
 * Patrones, resumen e intervenciones + consentimiento de señales opcionales.
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import SignalConsentPanel from '../../components/signals/SignalConsentPanel';
import { useProfileScreenStyles } from './profileScreenStyles';
import { ICON_SIZE, useProfileTexts } from './profileScreenConstants';

const PROGRESS_LINKS = [
  {
    key: 'summary',
    icon: 'chart-timeline-variant',
    labelKey: 'SUMMARY_NAV',
    a11yKey: 'SUMMARY_NAV_LABEL',
    navigate: (navigation) => navigation.navigate('ActivitySummary'),
  },
  {
    key: 'weekly',
    icon: 'chart-bell-curve',
    labelKey: 'WEEKLY_INSIGHT_NAV',
    a11yKey: 'WEEKLY_INSIGHT_NAV_LABEL',
    navigate: (navigation) => navigation.navigate('WeeklyInsight', { period: 'week' }),
  },
  {
    key: 'graph',
    icon: 'graph-outline',
    labelKey: 'INTERVENTION_GRAPH_NAV',
    a11yKey: 'INTERVENTION_GRAPH_NAV_LABEL',
    navigate: (navigation) => navigation.navigate('InterventionGraph'),
  },
];

export function ProfileProgressSection({ navigation }) {
  const TEXTS = useProfileTexts();
  const { styles, profileColors } = useProfileScreenStyles();

  return (
    <View style={styles.progressContainer}>
      <Text style={styles.sectionTitle}>{TEXTS.PROGRESS_TITLE}</Text>
      <Text style={styles.progressIntro}>{TEXTS.PROGRESS_INTRO}</Text>

      <View style={styles.progressLinkGroup}>
        {PROGRESS_LINKS.map((link, index) => (
          <TouchableOpacity
            key={link.key}
            style={[
              styles.progressLinkRow,
              index === PROGRESS_LINKS.length - 1 && styles.progressLinkRowLast,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              link.navigate(navigation);
            }}
            accessibilityRole="button"
            accessibilityLabel={TEXTS[link.a11yKey]}
          >
            <MaterialCommunityIcons
              name={link.icon}
              size={ICON_SIZE}
              color={profileColors.PRIMARY}
            />
            <Text style={styles.progressLinkText}>{TEXTS[link.labelKey]}</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={ICON_SIZE}
              color={profileColors.ACCENT}
            />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.progressSignalsWrap}>
        <SignalConsentPanel embedded />
      </View>
    </View>
  );
}
