/**
 * Micro-guías interactivas (#90–#99) — vista única con timeline.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SPACING } from '../../constants/ui';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import PsychoeducationClinicalReviewSeal from '../../components/PsychoeducationClinicalReviewSeal';
import ParticleBackground from '../../components/ParticleBackground';
import { api } from '../../config/api';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { pickLocalizedDefaults } from '../../utils/localizedFallback';
import { createInterventionCompletedRecorder } from '../../utils/recordInterventionCompleted';
import { createMicroGuideScreenStyles } from './microGuideScreenStyles';
import { usePsychoeducationTexts } from './psychoeducationTexts';

const DEFAULT_TEXTS_BY_LANG = {
  es: {
    LOADING: 'Cargando guía…',
    ERROR: 'No se pudo cargar la guía.',
    BACK: 'Volver',
    COMPLETE: 'Completar guía',
    DONE_TITLE: 'Guía completada',
    DONE_BODY: 'Has recorrido los pasos de esta guía. Puedes volver cuando lo necesites.',
    KICKER: 'Micro-guía',
    STEPS_HEADING: 'Pasos',
    TIP_LABEL: 'Al cerrar',
    READ_TIME: '~{n} min',
    STEP_COUNT: '{n} pasos',
  },
  en: {
    LOADING: 'Loading guide…',
    ERROR: 'Could not load the guide.',
    BACK: 'Back',
    COMPLETE: 'Complete guide',
    DONE_TITLE: 'Guide completed',
    DONE_BODY: 'You have gone through the steps. You can return whenever you need.',
    KICKER: 'Micro-guide',
    STEPS_HEADING: 'Steps',
    TIP_LABEL: 'When you finish',
    READ_TIME: '~{n} min',
    STEP_COUNT: '{n} steps',
  },
};

function TimelineStep({ index, total, step, styles, isLast }) {
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineRail}>
        <View style={styles.timelineDot}>
          <Text style={styles.timelineDotText}>{index + 1}</Text>
        </View>
        {!isLast ? <View style={styles.timelineLine} /> : null}
      </View>
      <View style={[styles.stepCard, isLast && { marginBottom: 4 }]}>
        {step?.title ? <Text style={styles.stepTitle}>{step.title}</Text> : null}
        {step?.body ? <Text style={styles.stepBody}>{step.body}</Text> : null}
      </View>
    </View>
  );
}

export default function MicroGuideScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle, resolvedScheme } = useTheme();
  const { language } = useLanguage();
  const translated = useSectionTranslations('TECHNIQUES');
  const sealTexts = usePsychoeducationTexts();

  const TEXTS = useMemo(() => {
    const defaults = pickLocalizedDefaults(language, DEFAULT_TEXTS_BY_LANG);
    return {
      LOADING: translated?.MICRO_GUIDE_LOADING || defaults.LOADING,
      ERROR: translated?.MICRO_GUIDE_ERROR || defaults.ERROR,
      BACK: translated?.MICRO_GUIDE_BACK || defaults.BACK,
      COMPLETE: translated?.MICRO_GUIDE_COMPLETE_CTA || defaults.COMPLETE,
      DONE_TITLE: translated?.MICRO_GUIDE_DONE_TITLE || defaults.DONE_TITLE,
      DONE_BODY: translated?.MICRO_GUIDE_DONE_BODY || defaults.DONE_BODY,
      KICKER: translated?.MICRO_GUIDE_KICKER || defaults.KICKER,
      STEPS_HEADING: translated?.MICRO_GUIDE_STEPS_HEADING || defaults.STEPS_HEADING,
      TIP_LABEL: translated?.MICRO_GUIDE_TIP_LABEL || defaults.TIP_LABEL,
      READ_TIME: translated?.MICRO_GUIDE_LIBRARY_READ_TIME || defaults.READ_TIME,
      STEP_COUNT: translated?.MICRO_GUIDE_LIBRARY_STEPS || defaults.STEP_COUNT,
    };
  }, [language, translated]);

  const styles = useMemo(
    () => createMicroGuideScreenStyles(colors, resolvedScheme),
    [colors, resolvedScheme],
  );

  const guideId = String(route?.params?.guideId || route?.params?.id || '').trim();
  const recordCompletedOnce = useMemo(() => createInterventionCompletedRecorder(), []);

  const [loading, setLoading] = useState(true);
  const [guide, setGuide] = useState(null);
  const [error, setError] = useState(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!guideId) {
        setError(TEXTS.ERROR);
        setLoading(false);
        return;
      }
      try {
        const res = await api.get(`/api/therapeutic-techniques/micro-guides/${guideId}`);
        if (cancelled) return;
        if (res?.success && res?.data && Array.isArray(res.data.steps) && res.data.steps.length > 0) {
          setGuide(res.data);
        } else {
          setError(TEXTS.ERROR);
        }
      } catch {
        if (!cancelled) setError(TEXTS.ERROR);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [guideId, language, TEXTS.ERROR]);

  const steps = useMemo(() => (Array.isArray(guide?.steps) ? guide.steps : []), [guide]);
  const totalSteps = steps.length;
  const minutesLabel = TEXTS.READ_TIME.replace('{n}', String(guide?.estimatedMinutes || 2));
  const stepsLabel = TEXTS.STEP_COUNT.replace('{n}', String(totalSteps || 0));

  const handleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    recordCompletedOnce(guide?.interventionId || guideId);
    setFinished(true);
  };

  const headerTitle = guide?.title || TEXTS.KICKER;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <ParticleBackground />
      <Header title={headerTitle} showBackButton onBackPress={() => navigation.goBack()} />

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.errorText}>{TEXTS.LOADING}</Text>
        </View>
      ) : error || totalSteps === 0 ? (
        <View style={styles.centerBox}>
          <MaterialCommunityIcons name="alert-circle-outline" size={40} color={colors.error} />
          <Text style={styles.errorText}>{error || TEXTS.ERROR}</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>{TEXTS.BACK}</Text>
          </TouchableOpacity>
        </View>
      ) : finished ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.xl }]}
        >
          <View style={styles.doneHero}>
            <View style={styles.doneIconWrap}>
              <MaterialCommunityIcons name="check-circle" size={44} color={colors.primary} />
            </View>
            <Text style={styles.doneTitle}>{TEXTS.DONE_TITLE}</Text>
            <Text style={styles.doneBody}>{guide?.completionNote || TEXTS.DONE_BODY}</Text>
            <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.doneBtnText}>{TEXTS.BACK}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.hero}>
              <View style={styles.heroIcon}>
                <Text style={styles.heroIconText}>{guide?.icon || '📘'}</Text>
              </View>
              <Text style={styles.heroKicker}>{TEXTS.KICKER}</Text>
              <Text style={styles.heroTitle}>{guide?.title}</Text>
              {guide?.intro ? <Text style={styles.heroLead}>{guide.intro}</Text> : null}
              <View style={styles.metaRow}>
                <View style={styles.metaPill}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color={colors.primary} />
                  <Text style={styles.metaPillText}>{minutesLabel}</Text>
                </View>
                <View style={styles.metaPill}>
                  <MaterialCommunityIcons
                    name="format-list-numbered"
                    size={14}
                    color={colors.primary}
                  />
                  <Text style={styles.metaPillText}>{stepsLabel}</Text>
                </View>
              </View>
              {guide?.clinicalReview ? (
                <View style={{ marginTop: 14, width: '100%' }}>
                  <PsychoeducationClinicalReviewSeal
                    clinicalReview={guide.clinicalReview}
                    texts={sealTexts}
                    variant="module"
                  />
                </View>
              ) : null}
            </View>

            <View style={styles.stepsSection}>
              <Text style={styles.stepsHeading}>{TEXTS.STEPS_HEADING}</Text>
              <View style={styles.timeline}>
                {steps.map((step, index) => (
                  <TimelineStep
                    key={`${index}-${step?.title || 'step'}`}
                    index={index}
                    total={totalSteps}
                    step={step}
                    styles={styles}
                    isLast={index === totalSteps - 1}
                  />
                ))}
              </View>
            </View>

            {guide?.completionNote ? (
              <View style={styles.tipCard}>
                <Text style={styles.tipLabel}>{TEXTS.TIP_LABEL}</Text>
                <Text style={styles.tipBody}>{guide.completionNote}</Text>
              </View>
            ) : null}

            {guide?.disclaimer ? (
              <Text style={styles.disclaimer}>{guide.disclaimer}</Text>
            ) : null}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.SCREEN_EDGE_INSET }]}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleComplete}
              accessibilityRole="button"
            >
              <Text style={styles.primaryBtnText}>{TEXTS.COMPLETE}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
