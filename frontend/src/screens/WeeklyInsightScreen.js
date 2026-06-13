/**
 * Pantalla de revelación semanal (#213 / #208).
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';
import ParticleBackground from '../components/ParticleBackground';
import SignalConsentPanel from '../components/signals/SignalConsentPanel';
import { SPACING } from '../constants/ui';
import { useTheme } from '../context/ThemeContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import signalsService from '../services/signalsService';

export default function WeeklyInsightScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle } = useTheme();
  const TEXTS = useSectionTranslations('TECHNIQUES');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [insight, setInsight] = useState(null);
  const [weekKey, setWeekKey] = useState(null);

  const copy = useMemo(
    () => ({
      title: TEXTS.WEEKLY_INSIGHT_TITLE || 'Tu semana en patrones',
      kicker: TEXTS.WEEKLY_INSIGHT_KICKER || 'Informe observacional',
      disclaimer:
        TEXTS.WEEKLY_INSIGHT_DISCLAIMER ||
        'Correlaciones, no causas. No sustituye orientación profesional.',
      empty:
        TEXTS.WEEKLY_INSIGHT_EMPTY ||
        'Aún no hay suficientes señales para un informe. Activa las opciones de abajo y sigue usando la app.',
      retry: TEXTS.WEEKLY_INSIGHT_RETRY || 'Reintentar',
      error: TEXTS.WEEKLY_INSIGHT_ERROR || 'No se pudo cargar el informe semanal.',
    }),
    [TEXTS],
  );

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await signalsService.fetchWeeklyInsight();
      setWeekKey(res?.weekKey || null);
      setInsight(res?.insight || null);
    } catch {
      setError(copy.error);
      setInsight(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [copy.error]);

  React.useEffect(() => {
    load();
  }, [load]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: colors.background },
        content: {
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingBottom: insets.bottom + 32,
        },
        hero: {
          alignItems: 'center',
          paddingTop: 8,
          paddingBottom: 24,
        },
        kicker: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 1.3,
          textTransform: 'uppercase',
          color: colors.primary,
          marginBottom: 10,
        },
        headline: {
          fontSize: 30,
          lineHeight: 36,
          fontWeight: '700',
          color: colors.text,
          textAlign: 'center',
          marginBottom: 12,
        },
        body: {
          fontSize: 16,
          lineHeight: 24,
          color: colors.textSecondary,
          textAlign: 'center',
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
          textAlign: 'center',
          marginTop: 8,
          marginBottom: 16,
        },
        meta: {
          fontSize: 12,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 12,
        },
        error: { color: colors.error, textAlign: 'center', marginBottom: 12 },
        retry: {
          alignSelf: 'center',
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 10,
          backgroundColor: colors.primary,
          marginBottom: 16,
        },
        retryText: { color: colors.white, fontWeight: '600' },
        center: { paddingVertical: 48, alignItems: 'center' },
      }),
    [colors, insets.bottom],
  );

  const rows = Array.isArray(insight?.insights) ? insight.insights : [];

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <ParticleBackground />
      <Header title={copy.title} showBackButton onBackPress={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: Platform.OS === 'android' ? 8 : 0 }]}
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
              <Text style={styles.kicker}>{copy.kicker}</Text>
              <Text style={styles.headline}>{insight?.headline || copy.empty}</Text>
              {insight?.body ? <Text style={styles.body}>{insight.body}</Text> : null}
            </View>

            {weekKey ? <Text style={styles.meta}>{weekKey}</Text> : null}

            {rows.map((row, index) => (
              <View key={`${row.type}-${index}`} style={styles.card}>
                <Text style={styles.cardTitle}>{row.label}</Text>
                <Text style={styles.cardText}>{row.detail}</Text>
              </View>
            ))}

            <Text style={styles.disclaimer}>{copy.disclaimer}</Text>
            <SignalConsentPanel compact />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
