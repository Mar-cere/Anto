/**
 * Hub de técnicas y herramientas (reemplaza el tab Pomodoro en la navbar).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import DashboardGroupedRow from '../components/dashboard/DashboardGroupedRow';
import FloatingNavBar from '../components/FloatingNavBar';
import { SPACING } from '../constants/ui';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import { createDashboardStyles } from '../styles/dashboardTheme';
import {
  TECHNIQUES_HUB_FOCUS_TOOLS,
  TECHNIQUES_HUB_GUIDED,
} from '../utils/techniquesHubConfig';
import {
  openTechniquesHubScreen,
  THERAPEUTIC_TECHNIQUES_ROUTE,
} from '../utils/techniquesHubNavigation';

const DEFAULT_TEXTS_ES = {
  TITLE: 'Técnicas',
  FOCUS_SECTION: 'Herramientas de enfoque',
  GUIDED_SECTION: 'Técnicas guiadas',
  POMODORO: 'Pomodoro',
  POMODORO_HINT: 'Enfócate en una tarea, paso a paso',
  BA: 'Activación conductual',
  BA_HINT: 'Plan semanal y registro de ánimo',
  ABC: 'Autorregistro ABC',
  ABC_HINT: 'Situación → pensamiento → consecuencia',
  EXPOSURE: 'Exposición gradual',
  EXPOSURE_HINT: 'Jerarquía de pasos',
  ALL_TECHNIQUES: 'Ver todas las técnicas',
};

const DEFAULT_TEXTS_EN = {
  TITLE: 'Techniques',
  FOCUS_SECTION: 'Focus tools',
  GUIDED_SECTION: 'Guided techniques',
  POMODORO: 'Pomodoro',
  POMODORO_HINT: 'Focus on one task, step by step',
  BA: 'Behavioral activation',
  BA_HINT: 'Weekly plan and mood logging',
  ABC: 'ABC self-monitoring',
  ABC_HINT: 'Situation → thought → consequence',
  EXPOSURE: 'Gradual exposure',
  EXPOSURE_HINT: 'Step hierarchy',
  ALL_TECHNIQUES: 'Browse all techniques',
};

function HubIcon({ item, color }) {
  if (item.iconSet === 'mci') {
    return <MaterialCommunityIcons name={item.icon} size={22} color={color} />;
  }
  return null;
}

export default function TechniquesHubScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, resolvedScheme, statusBarStyle } = useTheme();
  const { language } = useLanguage();
  const translated = useSectionTranslations('TECHNIQUES_HUB');
  const defaults = language === 'en' ? DEFAULT_TEXTS_EN : DEFAULT_TEXTS_ES;
  const TEXTS = useMemo(
    () => ({
      TITLE: translated?.TITLE || defaults.TITLE,
      FOCUS_SECTION: translated?.FOCUS_SECTION || defaults.FOCUS_SECTION,
      GUIDED_SECTION: translated?.GUIDED_SECTION || defaults.GUIDED_SECTION,
      POMODORO: translated?.POMODORO || defaults.POMODORO,
      POMODORO_HINT: translated?.POMODORO_HINT || defaults.POMODORO_HINT,
      BA: translated?.BA || defaults.BA,
      BA_HINT: translated?.BA_HINT || defaults.BA_HINT,
      ABC: translated?.ABC || defaults.ABC,
      ABC_HINT: translated?.ABC_HINT || defaults.ABC_HINT,
      EXPOSURE: translated?.EXPOSURE || defaults.EXPOSURE,
      EXPOSURE_HINT: translated?.EXPOSURE_HINT || defaults.EXPOSURE_HINT,
      ALL_TECHNIQUES: translated?.ALL_TECHNIQUES || defaults.ALL_TECHNIQUES,
    }),
    [translated, defaults, language],
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
          paddingTop: 8,
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
      }),
    [colors, dashStyles.eyebrow],
  );

  const openScreen = useCallback(
    (screen) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      openTechniquesHubScreen(navigation, screen);
    },
    [navigation],
  );

  const renderRows = useCallback(
    (items, { lastIndexOffset = 0 } = {}) =>
      items.map((item, index) => (
        <DashboardGroupedRow
          key={item.key}
          iconNode={<HubIcon item={item} color={colors.primary} />}
          title={TEXTS[item.labelKey]}
          subtitle={TEXTS[item.hintKey]}
          onPress={() => openScreen(item.screen)}
          isLast={index === items.length - 1 - lastIndexOffset}
        />
      )),
    [TEXTS, colors.primary, openScreen],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: insets.bottom + SPACING.FLOATING_NAV_SCROLL_BOTTOM_EXTRA,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.pageTitle} accessibilityRole="header">
            {TEXTS.TITLE}
          </Text>

          <View style={dashStyles.section}>
            <Text style={styles.sectionEyebrow} accessibilityRole="header">
              {TEXTS.FOCUS_SECTION.toUpperCase()}
            </Text>
            <View style={dashStyles.groupedList}>
              {renderRows(TECHNIQUES_HUB_FOCUS_TOOLS)}
            </View>
          </View>

          <View style={dashStyles.section}>
            <Text style={styles.sectionEyebrow} accessibilityRole="header">
              {TEXTS.GUIDED_SECTION.toUpperCase()}
            </Text>
            <View style={dashStyles.groupedList}>
              {renderRows(TECHNIQUES_HUB_GUIDED)}
            </View>
            <Pressable
              onPress={() => openScreen(THERAPEUTIC_TECHNIQUES_ROUTE)}
              style={dashStyles.sectionFooterLink}
              accessibilityRole="button"
              accessibilityLabel={TEXTS.ALL_TECHNIQUES}
            >
              <Text style={dashStyles.sectionFooterLinkText}>{TEXTS.ALL_TECHNIQUES}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      <FloatingNavBar activeTab="techniques" />
    </SafeAreaView>
  );
}
