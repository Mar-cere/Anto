/**
 * Pantalla de revelación semanal (#213 / #208).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';
import ParticleBackground from '../components/ParticleBackground';
import SignalConsentPanel from '../components/signals/SignalConsentPanel';
import { SPACING } from '../constants/ui';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import signalsService from '../services/signalsService';

export default function WeeklyInsightScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const { colors, statusBarStyle } = useTheme();
  const TEXTS = useSectionTranslations('TECHNIQUES');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [insight, setInsight] = useState(null);
  const [weekKey, setWeekKey] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const copy = useMemo(
    () => {
      const en = language === 'en';
      return {
        kicker: TEXTS.WEEKLY_INSIGHT_KICKER || (en ? 'Observational report' : 'Informe observacional'),
        disclaimer:
          TEXTS.WEEKLY_INSIGHT_DISCLAIMER ||
          (en
            ? 'Correlations, not causes. Not a substitute for professional care.'
            : 'Correlaciones, no causas. No sustituye orientación profesional.'),
        empty:
          TEXTS.WEEKLY_INSIGHT_EMPTY ||
          (en
            ? 'Not enough signal yet for a report. Turn on the options below and keep using the app.'
            : 'Aún no hay suficientes señales para un informe. Activa las opciones de abajo y sigue usando la app.'),
        retry: TEXTS.WEEKLY_INSIGHT_RETRY || (en ? 'Retry' : 'Reintentar'),
        error:
          TEXTS.WEEKLY_INSIGHT_ERROR ||
          (en ? 'Could not load the weekly report.' : 'No se pudo cargar el informe semanal.'),
      };
    },
    [TEXTS, language],
  );

  const load = useCallback(async () => {
    try {
      if (mountedRef.current) setError(null);
      const res = await signalsService.fetchWeeklyInsight();
      if (!mountedRef.current) return;
      setWeekKey(typeof res?.weekKey === 'string' ? res.weekKey : null);
      setInsight(res?.insight && typeof res.insight === 'object' ? res.insight : null);
    } catch {
      if (!mountedRef.current) return;
      setError(copy.error);
      setInsight(null);
      setWeekKey(null);
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }, [copy.error]);

  useEffect(() => {
    load();
  }, [load]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.background,
          paddingTop: Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight || 0,
        },
        content: {
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingTop: 4,
          paddingBottom: insets.bottom + 32,
        },
        hero: {
          width: '100%',
          paddingTop: 4,
          paddingBottom: 20,
        },
        headline: {
          fontSize: 24,
          lineHeight: 30,
          fontWeight: '700',
          color: colors.text,
          marginBottom: 8,
        },
        body: {
          fontSize: 15,
          lineHeight: 22,
          color: colors.textSecondary,
        },
        card: {
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          backgroundColor: colors.cardBackground || colors.surface || colors.background,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        cardTitle: {
          fontSize: 13,
          fontWeight: '700',
          color: colors.primary,
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
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
          marginBottom: 16,
        },
        meta: {
          alignSelf: 'flex-start',
          fontSize: 12,
          fontWeight: '600',
          color: colors.textSecondary,
          backgroundColor: colors.glassFill || colors.surface,
          borderRadius: 999,
          paddingHorizontal: 10,
          paddingVertical: 4,
          marginBottom: 12,
          overflow: 'hidden',
        },
        error: { color: colors.error, marginBottom: 12 },
        retry: {
          alignSelf: 'flex-start',
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 10,
          backgroundColor: colors.primary,
          marginBottom: 16,
        },
        retryText: { color: colors.white, fontWeight: '600' },
        center: { paddingVertical: 48, alignItems: 'center' },
      }),
    [colors, insets.top, insets.bottom],
  );

  const rows = useMemo(() => {
    const raw = Array.isArray(insight?.insights) ? insight.insights : [];
    return raw
      .filter((row) => row && typeof row === 'object')
      .map((row) => ({
        type: String(row.type || 'insight'),
        label: String(row.label || '').trim(),
        detail: String(row.detail || '').trim(),
      }))
      .filter((row) => row.label || row.detail);
  }, [insight?.insights]);
  const showBody = Boolean(String(insight?.body || '').trim()) && rows.length === 0;

  return (
    <View style={styles.root}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <ParticleBackground />
      <Header
        title={copy.kicker}
        showBackButton
        onBackPress={() => navigation?.goBack?.()}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : null}

        {error ? (
          <>
            <Text style={styles.error}>{error}</Text>
            <TouchableOpacity style={styles.retry} onPress={load}>
              <Text style={styles.retryText}>{copy.retry}</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {!loading && !error ? (
          <>
            <View style={styles.hero}>
              {weekKey ? <Text style={styles.meta}>{weekKey}</Text> : null}
              <Text style={styles.headline}>{insight?.headline || copy.empty}</Text>
              {showBody ? <Text style={styles.body}>{insight.body}</Text> : null}
            </View>

            {rows.map((row, index) => (
              <View
                key={`${row.type}-${index}`}
                style={styles.card}
                accessibilityRole="text"
                accessibilityLabel={`${row.label}. ${row.detail}`}
              >
                <Text style={styles.cardTitle}>{row.label}</Text>
                <Text style={styles.cardText}>{row.detail}</Text>
              </View>
            ))}

            <Text style={styles.disclaimer}>{copy.disclaimer}</Text>
            <SignalConsentPanel compact />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
