/**
 * Tarjeta de patrones macro ABC (#212) — lista factual, sin interpretación clínica.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import abcRecordsService from '../../services/abcRecordsService';
import { resolveAbcApiErrorMessage } from '../../utils/abcApiErrors';
import AbcMacroCycleVisual from './AbcMacroCycleVisual';

const COPY = {
  es: {
    title: 'Ciclos ABC recurrentes',
    disclaimer: 'Patrones observados en tu autorregistro; no es un diagnóstico.',
    openAbc: 'Abrir autorregistro ABC',
    count: (n) => `${n}× en este periodo`,
    empty: null,
    loadError: 'No se pudieron cargar los ciclos recurrentes.',
    rangeError: 'El periodo seleccionado no es válido.',
  },
  en: {
    title: 'Recurring ABC cycles',
    disclaimer: 'Patterns observed in your self-monitoring; not a diagnosis.',
    openAbc: 'Open ABC self-monitoring',
    count: (n) => `${n}× in this period`,
    empty: null,
    loadError: 'Could not load recurring cycles.',
    rangeError: 'The selected period is not valid.',
  },
};

export default function AbcMacroPatternsCard({
  startDate,
  endDate,
  patterns: patternsProp = null,
  compact = false,
  showCta = true,
  showCycleVisual = false,
  detail = 'summary',
}) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const navigation = useNavigation();
  const text = COPY[language === 'en' ? 'en' : 'es'];

  const needsFetch = !Array.isArray(patternsProp) && Boolean(startDate && endDate);
  const [loading, setLoading] = useState(needsFetch);
  const [patterns, setPatterns] = useState(Array.isArray(patternsProp) ? patternsProp : []);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    if (Array.isArray(patternsProp)) {
      setPatterns(patternsProp);
      setLoadError('');
      return;
    }
    if (!startDate || !endDate) {
      setPatterns([]);
      setLoadError('');
      return;
    }
    try {
      setLoading(true);
      setLoadError('');
      const result = await abcRecordsService.fetchAbcMacroPatterns({
        startDate,
        endDate,
        limit: 80,
        detail: showCycleVisual ? 'cycle' : detail,
      });
      setPatterns(result.patterns || []);
    } catch (err) {
      console.error('Error cargando patrones macro ABC:', err);
      setPatterns([]);
      setLoadError(
        resolveAbcApiErrorMessage(err, {
          MACRO_PATTERNS_ERROR: text.loadError,
          MACRO_PATTERNS_RANGE_ERROR: text.rangeError,
        }),
      );
    } finally {
      setLoading(false);
    }
  }, [endDate, patternsProp, showCycleVisual, detail, startDate, text.loadError, text.rangeError]);

  useEffect(() => {
    void load();
  }, [load]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          borderRadius: compact ? 12 : 16,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          padding: compact ? 12 : 16,
          marginBottom: compact ? 12 : 16,
          backgroundColor: colors.cardBackground || colors.surface || colors.background,
        },
        title: {
          fontSize: compact ? 13 : 14,
          fontWeight: '700',
          color: colors.text,
          marginBottom: 8,
        },
        row: {
          paddingVertical: 8,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        },
        rowFirst: { borderTopWidth: 0, paddingTop: 0 },
        situation: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.text,
          marginBottom: 4,
        },
        summary: {
          fontSize: 13,
          lineHeight: 19,
          color: colors.textSecondary,
        },
        meta: {
          fontSize: 11,
          color: colors.textSecondary,
          marginTop: 4,
        },
        disclaimer: {
          fontSize: 11,
          lineHeight: 16,
          color: colors.textSecondary,
          marginTop: 10,
        },
        cta: {
          marginTop: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        ctaText: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.primary,
        },
        loading: { paddingVertical: 12, alignItems: 'center' },
        errorText: {
          fontSize: 12,
          lineHeight: 17,
          color: colors.error || colors.textSecondary,
        },
      }),
    [colors, compact],
  );

  if (loading) {
    return (
      <View style={styles.wrap}>
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.wrap} accessibilityRole="alert">
        <Text style={styles.title}>{text.title}</Text>
        <Text style={styles.errorText}>{loadError}</Text>
      </View>
    );
  }

  if (!patterns.length) return null;

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <Text style={styles.title}>{text.title}</Text>
      {patterns.slice(0, 3).map((row, index) => (
        <View
          key={`${row.situationSample}-${index}`}
          style={[styles.row, index === 0 && styles.rowFirst]}
          accessibilityRole="text"
        >
          <Text style={styles.situation} numberOfLines={2}>
            {row.situationSample}
          </Text>
          <Text style={styles.summary}>{row.summary}</Text>
          {row.count >= 2 ? (
            <Text style={styles.meta}>{text.count(row.count)}</Text>
          ) : null}
          {showCycleVisual && row.cycle ? (
            <AbcMacroCycleVisual
              cycle={row.cycle}
              avgEmotionIntensity={row.avgEmotionIntensity}
              compact={compact}
              interactive={!compact}
            />
          ) : null}
        </View>
      ))}
      <Text style={styles.disclaimer}>{text.disclaimer}</Text>
      {showCta ? (
        <TouchableOpacity
          style={styles.cta}
          onPress={() => navigation.navigate('AbcRecord')}
          accessibilityRole="button"
          accessibilityLabel={text.openAbc}
        >
          <MaterialCommunityIcons name="clipboard-text-outline" size={18} color={colors.primary} />
          <Text style={styles.ctaText}>{text.openAbc}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
