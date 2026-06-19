/**
 * Patrones observados (informe semanal/mensual) embebido en Tu resumen.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import AbcMacroPatternsCard from '../abc/AbcMacroPatternsCard';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import signalsService from '../../services/signalsService';

export default function SummaryPatternsSection({
  period = 'week',
  weekKey = null,
  monthKey = null,
}) {
  const { language } = useLanguage();
  const { colors } = useTheme();
  const TEXTS = useSectionTranslations('TECHNIQUES');
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        block: { marginTop: 16, marginBottom: 4 },
        kicker: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 1.1,
          textTransform: 'uppercase',
          color: colors.primary,
          marginBottom: 8,
        },
        headline: {
          fontSize: 17,
          lineHeight: 24,
          fontWeight: '600',
          color: colors.text,
          marginBottom: 10,
        },
        card: {
          borderRadius: 14,
          padding: 14,
          marginBottom: 8,
          backgroundColor: colors.glassFill || colors.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        cardText: {
          fontSize: 15,
          lineHeight: 22,
          color: colors.text,
        },
        disclaimer: {
          fontSize: 12,
          lineHeight: 18,
          color: colors.textSecondary,
          marginTop: 4,
        },
        loading: { paddingVertical: 12, alignItems: 'center' },
      }),
    [colors],
  );

  const copy = useMemo(() => {
    const en = language === 'en';
    const isMonth = period === 'month';
    return {
      kicker:
        (isMonth ? TEXTS.MONTHLY_INSIGHT_KICKER : TEXTS.WEEKLY_INSIGHT_KICKER) ||
        (en
          ? isMonth
            ? 'This month'
            : 'This week'
          : isMonth
            ? 'Este mes'
            : 'Esta semana'),
      disclaimer:
        TEXTS.WEEKLY_INSIGHT_DISCLAIMER ||
        (en
          ? 'Trends from your use of the app, not a diagnosis.'
          : 'Tendencias de tu uso en la app, no un diagnóstico.'),
      empty:
        (isMonth ? TEXTS.MONTHLY_INSIGHT_EMPTY : TEXTS.WEEKLY_INSIGHT_EMPTY) ||
        (en
          ? 'We need a bit more activity to spot patterns.'
          : 'Necesitamos un poco más de actividad para ver patrones.'),
    };
  }, [TEXTS, language, period]);

  const load = useCallback(async () => {
    if (period === 'month' && !monthKey) {
      setInsight(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res =
        period === 'month'
          ? await signalsService.fetchMonthlyInsight({ monthKey })
          : await signalsService.fetchWeeklyInsight({ weekKey });
      setInsight(res?.insight && typeof res.insight === 'object' ? res.insight : null);
    } catch {
      setInsight(null);
    } finally {
      setLoading(false);
    }
  }, [period, weekKey, monthKey]);

  useEffect(() => {
    load();
  }, [load]);

  const abcPatterns = useMemo(() => {
    const raw = Array.isArray(insight?.abcPatterns) ? insight.abcPatterns : [];
    return raw.filter((row) => row && (row.summary || row.situationSample));
  }, [insight?.abcPatterns]);

  const rows = useMemo(() => {
    const raw = Array.isArray(insight?.insights) ? insight.insights : [];
    const skipAbcInsight = abcPatterns.length > 0;
    return raw
      .filter((row) => row && typeof row === 'object')
      .filter((row) => !(skipAbcInsight && row.type === 'abc_macro_pattern'))
      .map((row) => String(row.detail || row.label || '').trim())
      .filter(Boolean)
      .slice(0, 4);
  }, [insight?.insights, abcPatterns.length]);

  const conductSuggestion = String(insight?.conductSuggestion || '').trim();
  const headline = String(insight?.headline || '').trim();
  const hasContent = rows.length > 0 || abcPatterns.length > 0 || conductSuggestion || headline;

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!hasContent) {
    return null;
  }

  return (
    <View style={styles.block} accessibilityRole="summary">
      <Text style={styles.kicker}>{copy.kicker}</Text>
      {headline ? <Text style={styles.headline}>{headline}</Text> : null}
      {rows.map((line, index) => (
        <View key={`pattern-${index}`} style={styles.card}>
          <Text style={styles.cardText}>{line}</Text>
        </View>
      ))}
      {abcPatterns.length > 0 ? (
        <AbcMacroPatternsCard patterns={abcPatterns} compact showCta={false} />
      ) : null}
      {conductSuggestion ? (
        <View style={styles.card}>
          <Text style={styles.cardText}>{conductSuggestion}</Text>
        </View>
      ) : null}
      <Text style={styles.disclaimer}>{copy.disclaimer}</Text>
    </View>
  );
}
