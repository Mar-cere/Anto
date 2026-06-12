/**
 * Micro-guías interactivas (#90–#99 / catálogo #127).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
import ParticleBackground from '../../components/ParticleBackground';
import { api } from '../../config/api';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { createInterventionCompletedRecorder } from '../../utils/recordInterventionCompleted';
import { useTechniqueScreenStyles } from './techniqueScreenStyles';

const DEFAULT_TEXTS = {
  LOADING: 'Cargando guía…',
  ERROR: 'No se pudo cargar la guía.',
  BACK: 'Atrás',
  NEXT: 'Siguiente',
  COMPLETE: 'Completar',
  DONE_TITLE: 'Guía completada',
  DONE_BODY: 'Has recorrido los pasos de esta guía. Puedes volver cuando lo necesites.',
  STEP_OF: 'Paso {current} de {total}',
  KICKER: 'Micro-guía',
};

export default function MicroGuideScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle } = useTheme();
  const techniqueScreenStyles = useTechniqueScreenStyles();
  const translated = useSectionTranslations('TECHNIQUES');
  const TEXTS = useMemo(
    () => ({
      LOADING: translated?.MICRO_GUIDE_LOADING || DEFAULT_TEXTS.LOADING,
      ERROR: translated?.MICRO_GUIDE_ERROR || DEFAULT_TEXTS.ERROR,
      BACK: translated?.MICRO_GUIDE_BACK || DEFAULT_TEXTS.BACK,
      NEXT: translated?.MICRO_GUIDE_NEXT || DEFAULT_TEXTS.NEXT,
      COMPLETE: translated?.MICRO_GUIDE_COMPLETE || DEFAULT_TEXTS.COMPLETE,
      DONE_TITLE: translated?.MICRO_GUIDE_DONE_TITLE || DEFAULT_TEXTS.DONE_TITLE,
      DONE_BODY: translated?.MICRO_GUIDE_DONE_BODY || DEFAULT_TEXTS.DONE_BODY,
      STEP_OF: translated?.MICRO_GUIDE_STEP_OF || DEFAULT_TEXTS.STEP_OF,
      KICKER: translated?.MICRO_GUIDE_KICKER || DEFAULT_TEXTS.KICKER,
    }),
    [translated],
  );

  const guideId = String(route?.params?.guideId || route?.params?.id || '').trim();
  const recordCompletedOnce = useMemo(() => createInterventionCompletedRecorder(), []);

  const [loading, setLoading] = useState(true);
  const [guide, setGuide] = useState(null);
  const [error, setError] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
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
        if (res?.success && res?.data) {
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
  }, [guideId, TEXTS.ERROR]);

  const steps = useMemo(() => (Array.isArray(guide?.steps) ? guide.steps : []), [guide]);
  const totalSteps = steps.length;
  const isLast = stepIndex >= totalSteps - 1;

  const handleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    recordCompletedOnce(guide?.interventionId || guideId);
    setFinished(true);
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (isLast) {
      handleComplete();
      return;
    }
    setStepIndex((i) => Math.min(i + 1, totalSteps - 1));
  };

  const handleBack = () => {
    Haptics.selectionAsync().catch(() => {});
    if (stepIndex === 0) {
      navigation.goBack();
      return;
    }
    setStepIndex((i) => Math.max(0, i - 1));
  };

  const headerTitle = guide?.title || TEXTS.KICKER;
  const step = steps[stepIndex];
  const stepLabel = TEXTS.STEP_OF.replace('{current}', String(stepIndex + 1)).replace(
    '{total}',
    String(totalSteps || 1),
  );

  return (
    <SafeAreaView style={techniqueScreenStyles.container}>
      <StatusBar barStyle={statusBarStyle} />
      <ParticleBackground />
      <Header title={headerTitle} showBackButton onBackPress={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={[
          techniqueScreenStyles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View style={techniqueScreenStyles.card}>
            <ActivityIndicator color={colors.primary} />
            <Text style={techniqueScreenStyles.formHint}>{TEXTS.LOADING}</Text>
          </View>
        ) : error ? (
          <View style={techniqueScreenStyles.card}>
            <Text style={techniqueScreenStyles.formHint}>{error}</Text>
          </View>
        ) : finished ? (
          <View style={techniqueScreenStyles.card}>
            <MaterialCommunityIcons name="check-circle-outline" size={40} color={colors.primary} />
            <Text style={techniqueScreenStyles.formSectionHeading}>{TEXTS.DONE_TITLE}</Text>
            <Text style={techniqueScreenStyles.formHint}>
              {guide?.completionNote || TEXTS.DONE_BODY}
            </Text>
          </View>
        ) : (
          <>
            <View style={techniqueScreenStyles.introPanel}>
              <Text style={techniqueScreenStyles.introKicker}>{TEXTS.KICKER}</Text>
              <Text style={techniqueScreenStyles.introTitle}>{guide?.title}</Text>
              {guide?.intro ? (
                <Text style={techniqueScreenStyles.introBody}>{guide.intro}</Text>
              ) : null}
            </View>
            <View style={techniqueScreenStyles.card}>
              <Text style={techniqueScreenStyles.formHint}>{stepLabel}</Text>
              {step?.title ? (
                <Text style={techniqueScreenStyles.formSectionHeading}>{step.title}</Text>
              ) : null}
              <Text style={techniqueScreenStyles.formLabel}>{step?.body}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <TouchableOpacity
                style={[techniqueScreenStyles.secondaryButton, { flex: 1 }]}
                onPress={handleBack}
              >
                <Text style={techniqueScreenStyles.secondaryButtonText}>{TEXTS.BACK}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[techniqueScreenStyles.primaryButton, { flex: 1 }]}
                onPress={handleNext}
              >
                <Text style={techniqueScreenStyles.primaryButtonText}>
                  {isLast ? TEXTS.COMPLETE : TEXTS.NEXT}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
