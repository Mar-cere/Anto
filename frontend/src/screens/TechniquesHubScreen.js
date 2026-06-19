/**
 * Hub de técnicas y herramientas (tab principal de la navbar).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo } from 'react';
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DashboardGroupedRow from '../components/dashboard/DashboardGroupedRow';
import FloatingNavBar from '../components/FloatingNavBar';
import Header from '../components/Header';
import TechniquesCatalogPanel from '../components/techniques/TechniquesCatalogPanel';
import { SPACING } from '../constants/ui';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import { createDashboardStyles } from '../styles/dashboardTheme';
import { useTherapeuticTechniquesScreen } from './therapeuticTechniques/useTherapeuticTechniquesScreen';
import { TECHNIQUES_HUB_FOCUS_TOOLS } from '../utils/techniquesHubConfig';
import { openTechniquesHubScreen } from '../utils/techniquesHubNavigation';

const DEFAULT_TEXTS_ES = {
  TITLE: 'Técnicas',
  FOCUS_SECTION: 'Herramientas de enfoque',
  GUIDED_SECTION: 'Técnicas guiadas',
  POMODORO: 'Pomodoro',
  POMODORO_HINT: 'Enfócate en una tarea, paso a paso',
};

const DEFAULT_TEXTS_EN = {
  TITLE: 'Techniques',
  FOCUS_SECTION: 'Focus tools',
  GUIDED_SECTION: 'Guided techniques',
  POMODORO: 'Pomodoro',
  POMODORO_HINT: 'Focus on one task, step by step',
};

function HubIcon({ item, color }) {
  if (item.iconSet === 'mci') {
    return <MaterialCommunityIcons name={item.icon} size={22} color={color} />;
  }
  return null;
}

export default function TechniquesHubScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { colors, resolvedScheme, statusBarStyle } = useTheme();
  const { language } = useLanguage();
  const translated = useSectionTranslations('TECHNIQUES_HUB');
  const catalog = useTherapeuticTechniquesScreen();
  const showBack = route.name === 'TherapeuticTechniques';
  const defaults = language === 'en' ? DEFAULT_TEXTS_EN : DEFAULT_TEXTS_ES;
  const TEXTS = useMemo(
    () => ({
      TITLE: translated?.TITLE || defaults.TITLE,
      FOCUS_SECTION: translated?.FOCUS_SECTION || defaults.FOCUS_SECTION,
      GUIDED_SECTION: translated?.GUIDED_SECTION || defaults.GUIDED_SECTION,
      POMODORO: translated?.POMODORO || defaults.POMODORO,
      POMODORO_HINT: translated?.POMODORO_HINT || defaults.POMODORO_HINT,
    }),
    [translated, defaults],
  );
  const dashStyles = useMemo(
    () => createDashboardStyles(colors, resolvedScheme),
    [colors, resolvedScheme],
  );
  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: colors.background,
        },
        scroll: {
          flex: 1,
        },
        content: {
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingTop: showBack ? 0 : 8,
        },
        pageTitle: {
          fontSize: 34,
          fontWeight: '700',
          letterSpacing: -0.6,
          color: colors.text,
          marginBottom: 28,
        },
        sectionEyebrow: {
          ...dashStyles.eyebrow,
          marginBottom: 10,
          paddingHorizontal: 2,
        },
        catalogWrap: {
          marginTop: 4,
        },
      }),
    [colors, dashStyles.eyebrow, showBack],
  );

  const openScreen = useCallback(
    (screen) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      openTechniquesHubScreen(navigation, screen);
    },
    [navigation],
  );

  const renderFocusRows = useCallback(
    () =>
      TECHNIQUES_HUB_FOCUS_TOOLS.map((item, index) => (
        <DashboardGroupedRow
          key={item.key}
          iconNode={<HubIcon item={item} color={colors.primary} />}
          title={TEXTS[item.labelKey]}
          subtitle={TEXTS[item.hintKey]}
          onPress={() => openScreen(item.screen)}
          isLast={index === TECHNIQUES_HUB_FOCUS_TOOLS.length - 1}
        />
      )),
    [TEXTS, colors.primary, openScreen],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      {showBack ? <Header title={TEXTS.TITLE} showBackButton /> : null}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: insets.bottom + SPACING.FLOATING_NAV_SCROLL_BOTTOM_EXTRA,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={catalog.refreshing}
            onRefresh={catalog.handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.content}>
          {!showBack ? (
            <Text style={styles.pageTitle} accessibilityRole="header">
              {TEXTS.TITLE}
            </Text>
          ) : null}

          <View style={dashStyles.section}>
            <Text style={styles.sectionEyebrow} accessibilityRole="header">
              {TEXTS.FOCUS_SECTION.toUpperCase()}
            </Text>
            <View style={dashStyles.groupedList}>{renderFocusRows()}</View>
          </View>

          <View style={[dashStyles.section, styles.catalogWrap]}>
            <Text style={styles.sectionEyebrow} accessibilityRole="header">
              {TEXTS.GUIDED_SECTION.toUpperCase()}
            </Text>
            <TechniquesCatalogPanel
              catalog={catalog}
              embedded
              showStatsButton={showBack}
            />
          </View>
        </View>
      </ScrollView>
      <FloatingNavBar activeTab="techniques" />
    </SafeAreaView>
  );
}
