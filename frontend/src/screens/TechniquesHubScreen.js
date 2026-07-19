/**
 * Hub de técnicas y herramientas (tab principal de la navbar).
 */
import { useRoute } from '@react-navigation/native';
import React, { useMemo } from 'react';
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import FloatingNavBar from '../components/FloatingNavBar';
import Header from '../components/Header';
import TechniquesCatalogPanel from '../components/techniques/TechniquesCatalogPanel';
import { SPACING } from '../constants/ui';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import { useTherapeuticTechniquesScreen } from './therapeuticTechniques/useTherapeuticTechniquesScreen';
import { TECHNIQUES_HUB_FOCUS_TOOLS } from '../utils/techniquesHubConfig';

const DEFAULT_TEXTS_ES = {
  TITLE: 'Técnicas',
  SUBTITLE: 'Prácticas guiadas y herramientas para el momento que las necesites.',
  QUICK_ACCESS: 'Acceso rápido',
  CATALOG_SECTION: 'Catálogo por enfoque',
  POMODORO: 'Pomodoro',
  POMODORO_HINT: 'Enfócate en una tarea, paso a paso',
};

const DEFAULT_TEXTS_EN = {
  TITLE: 'Techniques',
  SUBTITLE: 'Guided practices and tools for when you need them.',
  QUICK_ACCESS: 'Quick access',
  CATALOG_SECTION: 'Catalog by approach',
  POMODORO: 'Pomodoro',
  POMODORO_HINT: 'Focus on one task, step by step',
};

export default function TechniquesHubScreen() {
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle } = useTheme();
  const { language } = useLanguage();
  const translated = useSectionTranslations('TECHNIQUES_HUB');
  const catalog = useTherapeuticTechniquesScreen();
  const showBack = route.name === 'TherapeuticTechniques';
  const defaults = language === 'en' ? DEFAULT_TEXTS_EN : DEFAULT_TEXTS_ES;
  const TEXTS = useMemo(
    () => ({
      TITLE: translated?.TITLE || defaults.TITLE,
      SUBTITLE: translated?.SUBTITLE || defaults.SUBTITLE,
      QUICK_ACCESS: translated?.QUICK_ACCESS || defaults.QUICK_ACCESS,
      CATALOG_SECTION: translated?.CATALOG_SECTION || defaults.CATALOG_SECTION,
      POMODORO: translated?.POMODORO || defaults.POMODORO,
      POMODORO_HINT: translated?.POMODORO_HINT || defaults.POMODORO_HINT,
    }),
    [translated, defaults],
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
          paddingTop: showBack ? 0 : SPACING.sm,
        },
        pageTitle: {
          fontSize: 30,
          fontWeight: '700',
          letterSpacing: -0.5,
          color: colors.text,
          marginBottom: 6,
        },
        pageSubtitle: {
          fontSize: 15,
          lineHeight: 21,
          color: colors.textSecondary,
          marginBottom: 22,
        },
      }),
    [colors, showBack],
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
            <>
              <Text style={styles.pageTitle} accessibilityRole="header">
                {TEXTS.TITLE}
              </Text>
              <Text style={styles.pageSubtitle}>{TEXTS.SUBTITLE}</Text>
            </>
          ) : null}

          <TechniquesCatalogPanel
            catalog={catalog}
            embedded
            showStatsButton={showBack}
            focusTools={TECHNIQUES_HUB_FOCUS_TOOLS}
            focusTexts={TEXTS}
          />
        </View>
      </ScrollView>
      <FloatingNavBar activeTab="techniques" />
    </SafeAreaView>
  );
}
