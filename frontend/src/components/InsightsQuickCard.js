/**
 * Acceso único a Tu resumen (actividad, patrones y lo que te ayuda).
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
  TITLE: 'Tu resumen',
  HINT: 'Actividad del período, patrones y lo que te ayuda en un solo lugar.',
  CTA: 'Abrir resumen',
  CTA_HINT: 'Mensajes, hábitos, patrones y técnicas que te sirven',
  CARD_A11Y: 'Tu resumen de actividad',
};

const DEFAULTS_EN = {
  TITLE: 'Your summary',
  HINT: 'Period activity, patterns, and what helps you — all in one place.',
  CTA: 'Open summary',
  CTA_HINT: 'Messages, habits, patterns, and techniques that help',
  CARD_A11Y: 'Your activity summary',
};

export default function InsightsQuickCard({ accessibilityLabel, embedded = false }) {
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
      CTA: translated?.INSIGHTS_CARD_SUMMARY || defaults.CTA,
      CTA_HINT: translated?.INSIGHTS_CARD_SUMMARY_HINT || defaults.CTA_HINT,
      CARD_A11Y: translated?.INSIGHTS_CARD_A11Y || defaults.CARD_A11Y,
    }),
    [translated, defaults],
  );

  const openSummary = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate('ActivitySummary');
  };

  const row = (
    <DashboardGroupedRow
      iconNode={(
        <MaterialCommunityIcons name="chart-timeline-variant" size={22} color={colors.primary} />
      )}
      title={TEXTS.CTA}
      subtitle={TEXTS.CTA_HINT}
      onPress={openSummary}
      accessibilityHint={TEXTS.CTA_HINT}
      isLast={embedded}
    />
  );

  if (embedded) {
    return row;
  }

  return (
    <DashboardSection
      title={TEXTS.TITLE}
      hint={TEXTS.HINT}
      accessibilityLabel={accessibilityLabel || TEXTS.CARD_A11Y}
    >
      <View style={styles.groupedList}>{row}</View>
    </DashboardSection>
  );
}
