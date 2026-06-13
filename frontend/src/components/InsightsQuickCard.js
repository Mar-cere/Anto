/**
 * Accesos directos a resumen, patrones semanales y mapa de intervenciones (1 toque desde Inicio).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import { getFocusTheme } from '../styles/focusCardTheme';

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

  const focus = useMemo(() => getFocusTheme(colors, resolvedScheme), [colors, resolvedScheme]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          ...focus.FOCUS_PANEL,
          marginBottom: 16,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginBottom: 6,
        },
        title: {
          fontSize: 16,
          fontWeight: '700',
          color: colors.text,
          flex: 1,
        },
        hint: {
          fontSize: 13,
          color: focus.FOCUS_META,
          lineHeight: 19,
          marginBottom: 4,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 11,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: focus.FOCUS_BORDER_SUBTLE,
        },
        rowIcon: {
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.glassFill,
        },
        rowBody: { flex: 1, minWidth: 0 },
        rowLabel: {
          fontSize: 15,
          fontWeight: '600',
          color: colors.text,
        },
        rowHint: {
          fontSize: 12,
          color: focus.FOCUS_META,
          marginTop: 2,
          lineHeight: 17,
        },
      }),
    [colors, focus],
  );

  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel || TEXTS.CARD_A11Y}
    >
      <View style={styles.header}>
        <MaterialCommunityIcons name="chart-arc" size={22} color={colors.primary} />
        <Text style={styles.title} accessibilityRole="header">
          {TEXTS.TITLE}
        </Text>
      </View>
      <Text style={styles.hint}>{TEXTS.HINT}</Text>
      {ROWS.map((row) => (
        <TouchableOpacity
          key={row.key}
          style={styles.row}
          activeOpacity={0.78}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate(row.screen);
          }}
          accessibilityRole="button"
          accessibilityLabel={TEXTS[row.labelKey]}
          accessibilityHint={TEXTS[row.hintKey]}
        >
          <View style={styles.rowIcon}>
            <MaterialCommunityIcons name={row.icon} size={22} color={colors.primary} />
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowLabel}>{TEXTS[row.labelKey]}</Text>
            <Text style={styles.rowHint} numberOfLines={2}>
              {TEXTS[row.hintKey]}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={focus.FOCUS_META} />
        </TouchableOpacity>
      ))}
    </View>
  );
}
