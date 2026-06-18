/**
 * Accesos directos a protocolos TCC desde el dashboard (BA, ABC, exposición).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import { createDashboardStyles } from '../styles/dashboardTheme';
import DashboardGroupedRow from './dashboard/DashboardGroupedRow';
import DashboardSection from './dashboard/DashboardSection';

const DEFAULT_TEXTS = {
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
  const translated = useSectionTranslations('DASH');
  const TEXTS = useMemo(
    () => ({
      TITLE: translated?.TCC_TOOLS_TITLE || DEFAULT_TEXTS.TITLE,
      HINT: translated?.TCC_TOOLS_HINT || DEFAULT_TEXTS.HINT,
      BA: translated?.TCC_TOOLS_BA || DEFAULT_TEXTS.BA,
      BA_HINT: translated?.TCC_TOOLS_BA_HINT || DEFAULT_TEXTS.BA_HINT,
      ABC: translated?.TCC_TOOLS_ABC || DEFAULT_TEXTS.ABC,
      ABC_HINT: translated?.TCC_TOOLS_ABC_HINT || DEFAULT_TEXTS.ABC_HINT,
      EXPOSURE: translated?.TCC_TOOLS_EXPOSURE || DEFAULT_TEXTS.EXPOSURE,
      EXPOSURE_HINT: translated?.TCC_TOOLS_EXPOSURE_HINT || DEFAULT_TEXTS.EXPOSURE_HINT,
      ALL: translated?.TCC_TOOLS_ALL || DEFAULT_TEXTS.ALL,
    }),
    [translated],
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
