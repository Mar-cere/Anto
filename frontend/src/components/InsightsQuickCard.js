/**
 * Accesos directos a resumen, patrones semanales y mapa de intervenciones (1 toque desde Inicio).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import { createDashboardStyles } from '../styles/dashboardTheme';
import DashboardGroupedRow from './dashboard/DashboardGroupedRow';
import DashboardSection from './dashboard/DashboardSection';

const DEFAULTS_ES = {
  TITLE: 'Tu actividad y patrones',
  HINT: 'Resumen, informe semanal y mapa de lo que te ayuda.',
  SUMMARY: 'Resumen semanal y mensual',
  SUMMARY_HINT: 'Mensajes, técnicas, hábitos y tono emocional',
  WEEKLY: 'Patrones de la semana',
  WEEKLY_HINT: 'Informe observacional de correlaciones',
  GRAPH: 'Mapa de temas e intervenciones',
  GRAPH_HINT: 'Qué temas del chat conectan con qué técnicas',
  CARD_A11Y: 'Tu actividad y patrones',
};

const DEFAULTS_EN = {
  TITLE: 'Your activity and patterns',
  HINT: 'Summary, weekly report, and map of what helps you.',
  SUMMARY: 'Weekly and monthly summary',
  SUMMARY_HINT: 'Messages, techniques, habits, and emotional tone',
  WEEKLY: 'Weekly patterns',
  WEEKLY_HINT: 'Observational correlation report',
  GRAPH: 'Topics and interventions map',
  GRAPH_HINT: 'How chat themes connect to techniques you use',
  CARD_A11Y: 'Your activity and patterns',
};

const ROWS = [
  {
    key: 'summary',
    screen: 'ActivitySummary',
    icon: 'chart-timeline-variant',
    labelKey: 'SUMMARY',
    hintKey: 'SUMMARY_HINT',
  },
  {
    key: 'weekly',
    screen: 'WeeklyInsight',
    icon: 'chart-bell-curve',
    labelKey: 'WEEKLY',
    hintKey: 'WEEKLY_HINT',
  },
  {
    key: 'graph',
    screen: 'InterventionGraph',
    icon: 'graph-outline',
    labelKey: 'GRAPH',
    hintKey: 'GRAPH_HINT',
  },
];

export default function InsightsQuickCard({ accessibilityLabel }) {
  const navigation = useNavigation();
  const { language } = useLanguage();
  const { colors, resolvedScheme } = useTheme();
  const styles = useMemo(
    () => createDashboardStyles(colors, resolvedScheme),
    [colors, resolvedScheme],
  );
  const translated = useSectionTranslations('DASH');
  const defaults = language === 'en' ? DEFAULTS_EN : DEFAULTS_ES;

  const TEXTS = useMemo(
    () => ({
      TITLE: translated?.INSIGHTS_CARD_TITLE || defaults.TITLE,
      HINT: translated?.INSIGHTS_CARD_HINT || defaults.HINT,
      SUMMARY: translated?.INSIGHTS_CARD_SUMMARY || defaults.SUMMARY,
      SUMMARY_HINT: translated?.INSIGHTS_CARD_SUMMARY_HINT || defaults.SUMMARY_HINT,
      WEEKLY: translated?.INSIGHTS_CARD_WEEKLY || defaults.WEEKLY,
      WEEKLY_HINT: translated?.INSIGHTS_CARD_WEEKLY_HINT || defaults.WEEKLY_HINT,
      GRAPH: translated?.INSIGHTS_CARD_GRAPH || defaults.GRAPH,
      GRAPH_HINT: translated?.INSIGHTS_CARD_GRAPH_HINT || defaults.GRAPH_HINT,
      CARD_A11Y: translated?.INSIGHTS_CARD_A11Y || defaults.CARD_A11Y,
    }),
    [translated, defaults],
  );

  const openRow = (row) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate(row.screen, row.key === 'weekly' ? { period: 'week' } : undefined);
  };

  return (
    <DashboardSection
      title={TEXTS.TITLE}
      hint={TEXTS.HINT}
      accessibilityLabel={accessibilityLabel || TEXTS.CARD_A11Y}
    >
      <View style={styles.groupedList}>
        {ROWS.map((row, index) => (
          <DashboardGroupedRow
            key={row.key}
            iconNode={(
              <MaterialCommunityIcons name={row.icon} size={22} color={colors.primary} />
            )}
            title={TEXTS[row.labelKey]}
            subtitle={TEXTS[row.hintKey]}
            onPress={() => openRow(row)}
            accessibilityHint={TEXTS[row.hintKey]}
            isLast={index === ROWS.length - 1}
          />
        ))}
      </View>
    </DashboardSection>
  );
}
