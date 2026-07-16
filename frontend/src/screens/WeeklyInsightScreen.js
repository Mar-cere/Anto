/**
 * Pantalla de revelación semanal (#213 / #208).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRoute } from '@react-navigation/native';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';
import DashboardBrandBackdrop from '../components/dashboard/DashboardBrandBackdrop';
import AbcMacroPatternsCard from '../components/abc/AbcMacroPatternsCard';
import WeeklyInsightCard from '../components/weeklyInsight/WeeklyInsightCard';
import WeeklyInsightConductCard from '../components/weeklyInsight/WeeklyInsightConductCard';
import WeeklyInsightHero from '../components/weeklyInsight/WeeklyInsightHero';
import WeeklyInsightSettingsSection from '../components/weeklyInsight/WeeklyInsightSettingsSection';
import WeeklyInsightSourceStrip from '../components/weeklyInsight/WeeklyInsightSourceStrip';
import WeeklyInsightStatusPanel from '../components/weeklyInsight/WeeklyInsightStatusPanel';
import { SPACING } from '../constants/ui';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import signalsService from '../services/signalsService';
import { resolveMonthlyInsightKey } from '../utils/monthKeys';
import { isSubscriptionRequiredError } from '../utils/subscriptionAccess';
import {
  buildInsightRowNavigation,
  buildInsightSourceChips,
  enrichInsightRows,
  formatInsightPeriodLabel,
} from '../utils/weeklyInsightUtils';

export default function WeeklyInsightScreen({ navigation }) {
  const route = useRoute();
  const period = route?.params?.period === 'month' ? 'month' : 'week';
  const weekKeyParam = typeof route?.params?.weekKey === 'string' ? route.params.weekKey.trim() : null;
  const monthKeyParam = useMemo(
    () =>
      period === 'month'
        ? resolveMonthlyInsightKey(route?.params?.monthKey, {
            year: route?.params?.year,
            month: route?.params?.month,
          })
        : null,
    [period, route?.params?.monthKey, route?.params?.year, route?.params?.month],
  );
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const { colors, statusBarStyle } = useTheme();
  const TEXTS = useSectionTranslations('TECHNIQUES');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  /** @type {[null|'subscription'|'error', function]} */
  const [statusKind, setStatusKind] = useState(null);
  const [insight, setInsight] = useState(null);
  const [correlations, setCorrelations] = useState([]);
  const [periodKey, setPeriodKey] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const copy = useMemo(() => {
    const en = language === 'en';
    const isMonth = period === 'month';
    return {
      kicker:
        (isMonth ? TEXTS.MONTHLY_INSIGHT_KICKER : TEXTS.WEEKLY_INSIGHT_KICKER) ||
        (en
          ? isMonth
            ? 'Monthly observational report'
            : 'Observational report'
          : isMonth
            ? 'Informe observacional mensual'
            : 'Informe observacional'),
      disclaimer:
        TEXTS.WEEKLY_INSIGHT_DISCLAIMER ||
        (en
          ? 'Correlations, not causes. Not a substitute for professional care.'
          : 'Correlaciones, no causas. No sustituye orientación profesional.'),
      emptyTitle:
        (isMonth ? TEXTS.MONTHLY_INSIGHT_EMPTY_TITLE : TEXTS.WEEKLY_INSIGHT_EMPTY_TITLE) ||
        (en
          ? isMonth
            ? 'No monthly report yet'
            : 'No report yet'
          : isMonth
            ? 'Aún no hay un informe mensual'
            : 'Aún no hay un informe'),
      empty:
        (isMonth ? TEXTS.MONTHLY_INSIGHT_EMPTY : TEXTS.WEEKLY_INSIGHT_EMPTY) ||
        TEXTS.WEEKLY_INSIGHT_EMPTY ||
        (en
          ? isMonth
            ? 'Not enough signal yet for a monthly report. Turn on the options below and keep using the app.'
            : 'Not enough signal yet for a report. Turn on the options below and keep using the app.'
          : isMonth
            ? 'Aún no hay suficientes señales para un informe mensual. Activa las opciones de abajo y sigue usando la app.'
            : 'Aún no hay suficientes señales para un informe. Activa las opciones de abajo y sigue usando la app.'),
      retry: TEXTS.WEEKLY_INSIGHT_RETRY || (en ? 'Retry' : 'Reintentar'),
      errorTitle:
        (isMonth ? TEXTS.MONTHLY_INSIGHT_ERROR_TITLE : TEXTS.WEEKLY_INSIGHT_ERROR_TITLE) ||
        (en ? 'Could not load' : 'No se pudo cargar'),
      error:
        (isMonth ? TEXTS.MONTHLY_INSIGHT_ERROR : TEXTS.WEEKLY_INSIGHT_ERROR) ||
        TEXTS.WEEKLY_INSIGHT_ERROR ||
        (en
          ? isMonth
            ? 'Could not load the monthly report.'
            : 'Could not load the weekly report.'
          : isMonth
            ? 'No se pudo cargar el informe mensual.'
            : 'No se pudo cargar el informe semanal.'),
      subscriptionTitle:
        TEXTS.WEEKLY_INSIGHT_SUBSCRIPTION_TITLE ||
        (en ? 'Report with subscription' : 'Informe con suscripción'),
      subscriptionBody:
        TEXTS.WEEKLY_INSIGHT_SUBSCRIPTION_BODY ||
        (en
          ? 'The observational report is included with an active subscription or trial period.'
          : 'El informe observacional forma parte del plan con suscripción activa o período de prueba.'),
      subscriptionCta:
        TEXTS.WEEKLY_INSIGHT_SUBSCRIPTION_CTA || (en ? 'View plans' : 'Ver planes'),
      conductTitle:
        TEXTS.WEEKLY_INSIGHT_CONDUCT_TITLE || (en ? 'Small step to try' : 'Pequeño paso a probar'),
      conductCta:
        TEXTS.WEEKLY_INSIGHT_CONDUCT_CTA || (en ? 'Talk with Anto' : 'Hablar con Anto'),
      rowCtaPsycho:
        TEXTS.WEEKLY_INSIGHT_ROW_CTA_PSYCHO || (en ? 'Open module' : 'Abrir módulo'),
      rowCtaTechniques:
        TEXTS.WEEKLY_INSIGHT_ROW_CTA_TECHNIQUES || (en ? 'See in techniques' : 'Ver en técnicas'),
      settingsTitle:
        TEXTS.WEEKLY_INSIGHT_SETTINGS_TITLE || (en ? 'Adjust signals' : 'Ajustar señales'),
      settingsHint:
        TEXTS.WEEKLY_INSIGHT_SETTINGS_HINT ||
        (en
          ? 'Writing pace, digital health, and reports'
          : 'Ritmo al escribir, salud digital e informes'),
      sourceTexts: {
        SOURCE_CHAT_DAYS:
          TEXTS.WEEKLY_INSIGHT_SOURCE_CHAT_DAYS || (en ? '{n} chat days' : '{n} días en chat'),
        SOURCE_TYPING:
          TEXTS.WEEKLY_INSIGHT_SOURCE_TYPING ||
          (en ? '{n} drafts analyzed' : '{n} borradores analizados'),
        SOURCE_PHENOTYPE:
          TEXTS.WEEKLY_INSIGHT_SOURCE_PHENOTYPE ||
          (en ? '{n} days of signals' : '{n} días de señales'),
      },
    };
  }, [TEXTS, language, period]);

  const load = useCallback(async () => {
    try {
      if (mountedRef.current) {
        setStatusKind(null);
        setLoading(true);
      }
      if (period === 'month' && !monthKeyParam) {
        if (!mountedRef.current) return;
        setStatusKind('error');
        setInsight(null);
        setCorrelations([]);
        setPeriodKey(null);
        return;
      }
      const res =
        period === 'month'
          ? await signalsService.fetchMonthlyInsight({ monthKey: monthKeyParam })
          : await signalsService.fetchWeeklyInsight({ weekKey: weekKeyParam });
      if (!mountedRef.current) return;
      const key =
        period === 'month'
          ? typeof res?.monthKey === 'string'
            ? res.monthKey
            : monthKeyParam
          : typeof res?.weekKey === 'string'
            ? res.weekKey
            : weekKeyParam;
      setPeriodKey(key);
      const payload = res?.insight && typeof res.insight === 'object' ? res.insight : null;
      setInsight(payload);
      setCorrelations(Array.isArray(payload?.correlations) ? payload.correlations : []);
      setStatusKind(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setInsight(null);
      setCorrelations([]);
      setPeriodKey(null);
      setStatusKind(isSubscriptionRequiredError(err) ? 'subscription' : 'error');
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, weekKeyParam, monthKeyParam]);

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
          flexGrow: 1,
        },
        disclaimer: {
          fontSize: 12,
          lineHeight: 18,
          color: colors.textSecondary,
          marginTop: 4,
          marginBottom: 16,
        },
        center: { paddingVertical: 48, alignItems: 'center' },
      }),
    [colors, insets.top, insets.bottom],
  );

  const abcPatterns = useMemo(() => {
    const raw = Array.isArray(insight?.abcPatterns) ? insight.abcPatterns : [];
    return raw.filter((row) => row && (row.summary || row.situationSample));
  }, [insight?.abcPatterns]);

  const rows = useMemo(() => {
    const enriched = enrichInsightRows(insight?.insights, correlations);
    const skipAbcInsight = abcPatterns.length > 0;
    return enriched.filter((row) => !(skipAbcInsight && row.type === 'abc_macro_pattern'));
  }, [insight?.insights, correlations, abcPatterns.length]);

  const showBody = Boolean(String(insight?.body || '').trim()) && rows.length === 0;
  const conductSuggestion = String(insight?.conductSuggestion || '').trim();
  const extraDisclaimers = useMemo(() => {
    const raw = Array.isArray(insight?.disclaimers) ? insight.disclaimers : [];
    return raw.map((d) => String(d || '').trim()).filter(Boolean);
  }, [insight?.disclaimers]);

  const periodLabel = useMemo(
    () =>
      formatInsightPeriodLabel({
        periodKey,
        period,
        language,
      }),
    [periodKey, period, language],
  );

  const sourceChips = useMemo(
    () => buildInsightSourceChips(insight?.sourceSummary, copy.sourceTexts),
    [insight?.sourceSummary, copy.sourceTexts],
  );

  const hasInsightContent = rows.length > 0 || abcPatterns.length > 0 || Boolean(conductSuggestion);
  const showEmpty = !loading && !statusKind && !hasInsightContent;

  const openRowTarget = useCallback(
    (row) => {
      const nav = buildInsightRowNavigation(row.targetId);
      if (!nav) return;
      navigation?.navigate?.(nav.screen, nav.params);
    },
    [navigation],
  );

  const rowCtaLabel = useCallback(
    (row) => {
      const nav = buildInsightRowNavigation(row.targetId);
      if (!nav) return null;
      return nav.screen === 'PsychoeducationModule' ? copy.rowCtaPsycho : copy.rowCtaTechniques;
    },
    [copy.rowCtaPsycho, copy.rowCtaTechniques],
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <DashboardBrandBackdrop />
      <Header title={copy.kicker} showBackButton onBackPress={() => navigation?.goBack?.()} />
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

        {!loading && statusKind === 'subscription' ? (
          <WeeklyInsightStatusPanel
            icon="lock-outline"
            title={copy.subscriptionTitle}
            body={copy.subscriptionBody}
            ctaLabel={copy.subscriptionCta}
            onPressCta={() => navigation?.navigate?.('Subscription')}
          />
        ) : null}

        {!loading && statusKind === 'error' ? (
          <WeeklyInsightStatusPanel
            icon="cloud-off-outline"
            title={copy.errorTitle}
            body={copy.error}
            ctaLabel={copy.retry}
            onPressCta={load}
          />
        ) : null}

        {!loading && !statusKind ? (
          <>
            {showEmpty ? (
              <WeeklyInsightStatusPanel
                icon="chart-timeline-variant"
                title={copy.emptyTitle}
                body={copy.empty}
              />
            ) : (
              <>
                <WeeklyInsightHero
                  periodLabel={periodLabel}
                  headline={insight?.headline || copy.emptyTitle}
                  body={showBody ? insight.body : null}
                />

                {hasInsightContent ? (
                  <>
                    <WeeklyInsightSourceStrip chips={sourceChips} />

                    {conductSuggestion ? (
                      <WeeklyInsightConductCard
                        title={copy.conductTitle}
                        body={conductSuggestion}
                        ctaLabel={copy.conductCta}
                        onPress={() => navigation?.navigate?.('MainTabs', { screen: 'Chat' })}
                      />
                    ) : null}

                    {rows.map((row, index) => {
                      const ctaLabel = rowCtaLabel(row);
                      return (
                        <WeeklyInsightCard
                          key={`${row.type}-${index}`}
                          row={row}
                          ctaLabel={ctaLabel}
                          onPressCta={
                            row.targetId && ctaLabel ? () => openRowTarget(row) : null
                          }
                        />
                      );
                    })}

                    {abcPatterns.length > 0 ? (
                      <AbcMacroPatternsCard patterns={abcPatterns} compact showCta />
                    ) : null}

                    <Text style={styles.disclaimer}>
                      {[copy.disclaimer, ...extraDisclaimers].filter(Boolean).join(' ')}
                    </Text>
                  </>
                ) : null}
              </>
            )}

            <WeeklyInsightSettingsSection
              title={copy.settingsTitle}
              hint={copy.settingsHint}
              sourceSummary={insight?.sourceSummary}
              defaultExpanded={!hasInsightContent}
            />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
