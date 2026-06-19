/**
 * Sección «Explorar»: herramientas TCC, diario y resumen en una sola lista.
 */
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { createDashboardStyles } from '../../styles/dashboardTheme';
import InsightsQuickCard from '../InsightsQuickCard';
import JournalCard from '../JournalCard';
import TccProtocolsQuickCard from '../TccProtocolsQuickCard';
import DashboardSection from './DashboardSection';

const DEFAULTS_ES = {
  TITLE: 'Explorar',
  HINT: 'Herramientas, diario y tu resumen cuando quieras profundizar.',
  ALL_TECHNIQUES: 'Ver todas las técnicas',
};

const DEFAULTS_EN = {
  TITLE: 'Explore',
  HINT: 'Tools, journal, and your summary when you want to go deeper.',
  ALL_TECHNIQUES: 'Browse all techniques',
};

export default function DashboardExploreSection({ techniquesA11y, insightsA11y }) {
  const navigation = useNavigation();
  const { language } = useLanguage();
  const { colors, resolvedScheme } = useTheme();
  const translated = useSectionTranslations('DASH');
  const defaults = language === 'en' ? DEFAULTS_EN : DEFAULTS_ES;
  const styles = useMemo(
    () => createDashboardStyles(colors, resolvedScheme),
    [colors, resolvedScheme],
  );

  const TEXTS = useMemo(
    () => ({
      TITLE: translated?.EXPLORE_SECTION_TITLE || defaults.TITLE,
      HINT: translated?.EXPLORE_SECTION_HINT || defaults.HINT,
      ALL_TECHNIQUES: translated?.TCC_TOOLS_ALL || defaults.ALL_TECHNIQUES,
    }),
    [translated, defaults],
  );

  const openAllTechniques = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate('TherapeuticTechniques');
  };

  return (
    <DashboardSection
      title={TEXTS.TITLE}
      hint={TEXTS.HINT}
      footerLabel={TEXTS.ALL_TECHNIQUES}
      onFooterPress={openAllTechniques}
      accessibilityLabel={TEXTS.TITLE}
    >
      <View style={styles.groupedList}>
        <TccProtocolsQuickCard embedded accessibilityLabel={techniquesA11y} />
        <JournalCard embedded />
        <InsightsQuickCard embedded accessibilityLabel={insightsA11y} />
      </View>
    </DashboardSection>
  );
}
