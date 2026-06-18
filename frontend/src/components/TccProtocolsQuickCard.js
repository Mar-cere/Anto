/**
 * Accesos directos a protocolos TCC desde el dashboard (BA, ABC, exposición).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import { createDashboardStyles } from '../styles/dashboardTheme';
import DashboardGroupedRow from './dashboard/DashboardGroupedRow';
import DashboardSection from './dashboard/DashboardSection';

const DEFAULT_TEXTS_ES = {
  TITLE: 'Herramientas de seguimiento',
  HINT: 'Protocolos guiados para practicar entre conversaciones con Anto.',
  BA: 'Activación conductual',
  BA_HINT: 'Plan semanal y registro de ánimo',
  ABC: 'Autorregistro ABC',
  ABC_HINT: 'Situación → pensamiento → consecuencia',
  EXPOSURE: 'Exposición gradual',
  EXPOSURE_HINT: 'Jerarquía de pasos',
  ALL: 'Ver todas las técnicas',
};

const DEFAULT_TEXTS_EN = {
  TITLE: 'Follow-up tools',
  HINT: 'Guided protocols to practice between chats with Anto.',
  BA: 'Behavioral activation',
  BA_HINT: 'Weekly plan and mood logging',
  ABC: 'ABC self-monitoring',
  ABC_HINT: 'Situation → thought → consequence',
  EXPOSURE: 'Gradual exposure',
  EXPOSURE_HINT: 'Step hierarchy',
  ALL: 'Browse all techniques',
};

const TOOL_ITEMS = [
  { key: 'ba', screen: 'BehavioralActivation', icon: 'walk', labelKey: 'BA', hintKey: 'BA_HINT' },
  { key: 'abc', screen: 'AbcRecord', icon: 'clipboard-text-outline', labelKey: 'ABC', hintKey: 'ABC_HINT' },
  {
    key: 'exposure',
    screen: 'ExposureHierarchy',
    icon: 'stairs',
    labelKey: 'EXPOSURE',
    hintKey: 'EXPOSURE_HINT',
  },
];

export default function TccProtocolsQuickCard({ accessibilityLabel }) {
  const navigation = useNavigation();
  const { colors, resolvedScheme } = useTheme();
  const styles = useMemo(
    () => createDashboardStyles(colors, resolvedScheme),
    [colors, resolvedScheme],
  );
  const { language } = useLanguage();
  const translated = useSectionTranslations('DASH');
  const defaults = language === 'en' ? DEFAULT_TEXTS_EN : DEFAULT_TEXTS_ES;
  const TEXTS = useMemo(
    () => ({
      TITLE: translated?.TCC_TOOLS_TITLE || defaults.TITLE,
      HINT: translated?.TCC_TOOLS_HINT || defaults.HINT,
      BA: translated?.TCC_TOOLS_BA || defaults.BA,
      BA_HINT: translated?.TCC_TOOLS_BA_HINT || defaults.BA_HINT,
      ABC: translated?.TCC_TOOLS_ABC || defaults.ABC,
      ABC_HINT: translated?.TCC_TOOLS_ABC_HINT || defaults.ABC_HINT,
      EXPOSURE: translated?.TCC_TOOLS_EXPOSURE || defaults.EXPOSURE,
      EXPOSURE_HINT: translated?.TCC_TOOLS_EXPOSURE_HINT || defaults.EXPOSURE_HINT,
      ALL: translated?.TCC_TOOLS_ALL || defaults.ALL,
    }),
    [translated, defaults],
  );

  const openScreen = (screen) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate(screen);
  };

  return (
    <DashboardSection
      title={TEXTS.TITLE}
      hint={TEXTS.HINT}
      footerLabel={TEXTS.ALL}
      onFooterPress={() => openScreen('TherapeuticTechniques')}
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.groupedList}>
        {TOOL_ITEMS.map((item, index) => (
          <DashboardGroupedRow
            key={item.key}
            iconNode={(
              <MaterialCommunityIcons name={item.icon} size={22} color={colors.primary} />
            )}
            title={TEXTS[item.labelKey]}
            subtitle={TEXTS[item.hintKey]}
            onPress={() => openScreen(item.screen)}
            isLast={index === TOOL_ITEMS.length - 1}
          />
        ))}
      </View>
    </DashboardSection>
  );
}
