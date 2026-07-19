/**
 * Preferencia inicial de onboarding (una sola elección opcional).
 */
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { api, ENDPOINTS } from '../config/api';
import { useToast } from '../context/ToastContext';
import { SPACING } from '../constants/ui';
import { useTheme } from '../context/ThemeContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import { buildOnboardingBenefits } from '../utils/onboardingSteps';
import OnboardingBenefitList from './onboarding/OnboardingBenefitList';
import OnboardingBrandShell from './onboarding/OnboardingBrandShell';
import OnboardingGradientButton from './onboarding/OnboardingGradientButton';

const DEFAULT_TEXTS = {
  TITLE: '¿En qué quieres enfocarte primero?',
  SUBTITLE:
    'Anto adaptará el chat y las sugerencias a tu prioridad. Puedes cambiarla cuando quieras.',
  BENEFITS_HEADING: 'Con Anto tendrás',
  BENEFIT_1: 'Chat personalizado según cómo te sientes',
  BENEFIT_2: 'Técnicas de TCC y escalas clínicas (PHQ-9, GAD-7)',
  BENEFIT_3: 'Resumen semanal, hábitos y recursos de crisis',
  MAIN_LABEL: 'Ahora mismo me interesa más…',
  SKIP: 'Omitir',
  SUBMIT: 'Empezar con Anto',
  EXPLORE_APP: 'Repasar recorrido',
  SAVE_SUCCESS: 'Listo, gracias',
  SAVE_ERROR: 'No se pudo guardar tu elección. Puedes omitir y seguir.',
  TOO_MANY_ATTEMPTS:
    'Demasiados intentos. Espera un momento y vuelve a intentar.',
  CONNECTION_ERROR:
    'No hay conexión. Verifica tu internet e inténtalo de nuevo.',
  FOCUS_OPTIONS: [
    'Apoyo emocional',
    'Ansiedad o estrés',
    'Sueño y descanso',
    'Hábitos y rutinas',
    'Enfoque y organización',
  ],
};

const resolveOnboardingErrorMessage = (error, texts) => {
  const status = error?.response?.status;
  const rawMessage = String(
    error?.response?.data?.message ?? error?.message ?? '',
  ).toLowerCase();

  const isNetworkIssue =
    !error?.response ||
    rawMessage.includes('network') ||
    rawMessage.includes('econnrefused') ||
    rawMessage.includes('timeout') ||
    rawMessage.includes('timed out');
  if (isNetworkIssue) {
    return texts.CONNECTION_ERROR;
  }

  if (
    status === 429 ||
    rawMessage.includes('too many') ||
    rawMessage.includes('demasiados intentos')
  ) {
    return texts.TOO_MANY_ATTEMPTS;
  }

  return texts.SAVE_ERROR;
};

const OnboardingQuestions = ({ visible, onDismiss, onCompleted, onExploreApp }) => {
  const { showToast } = useToast();
  const translated = useSectionTranslations('ONBOARDING');
  const TEXTS = useMemo(
    () => ({
      ...DEFAULT_TEXTS,
      TITLE: translated?.QUESTIONS_TITLE || DEFAULT_TEXTS.TITLE,
      SUBTITLE: translated?.QUESTIONS_SUBTITLE || DEFAULT_TEXTS.SUBTITLE,
      BENEFITS_HEADING:
        translated?.QUESTIONS_BENEFITS_HEADING || DEFAULT_TEXTS.BENEFITS_HEADING,
      BENEFIT_1: translated?.BENEFIT_1 || DEFAULT_TEXTS.BENEFIT_1,
      BENEFIT_2: translated?.BENEFIT_2 || DEFAULT_TEXTS.BENEFIT_2,
      BENEFIT_3: translated?.BENEFIT_3 || DEFAULT_TEXTS.BENEFIT_3,
      MAIN_LABEL: translated?.QUESTIONS_MAIN_LABEL || DEFAULT_TEXTS.MAIN_LABEL,
      SKIP: translated?.SKIP || DEFAULT_TEXTS.SKIP,
      SUBMIT: translated?.QUESTIONS_SUBMIT || DEFAULT_TEXTS.SUBMIT,
      EXPLORE_APP:
        translated?.QUESTIONS_EXPLORE_APP || DEFAULT_TEXTS.EXPLORE_APP,
      SAVE_SUCCESS:
        translated?.QUESTIONS_SAVE_SUCCESS || DEFAULT_TEXTS.SAVE_SUCCESS,
      SAVE_ERROR: translated?.QUESTIONS_SAVE_ERROR || DEFAULT_TEXTS.SAVE_ERROR,
      TOO_MANY_ATTEMPTS:
        translated?.QUESTIONS_TOO_MANY_ATTEMPTS ||
        DEFAULT_TEXTS.TOO_MANY_ATTEMPTS,
      CONNECTION_ERROR:
        translated?.QUESTIONS_CONNECTION_ERROR ||
        DEFAULT_TEXTS.CONNECTION_ERROR,
      FOCUS_OPTIONS:
        translated?.QUESTIONS_FOCUS_OPTIONS || DEFAULT_TEXTS.FOCUS_OPTIONS,
    }),
    [translated],
  );
  const benefits = useMemo(() => buildOnboardingBenefits(TEXTS), [TEXTS]);
  const { colors } = useTheme();
  const [focusChoice, setFocusChoice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          marginBottom: 6,
        },
        title: {
          fontSize: 22,
          fontWeight: '800',
          color: colors.text,
          textAlign: 'center',
          marginBottom: 8,
          letterSpacing: -0.2,
        },
        subtitle: {
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 20,
        },
        label: {
          color: colors.text,
          fontSize: 13,
          fontWeight: '700',
          marginTop: 18,
          marginBottom: 10,
        },
        optionList: {
          gap: SPACING.sm,
        },
        optionRow: {
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 14,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          backgroundColor: colors.glassFill,
          paddingVertical: SPACING.HERO_INSET_COMPACT,
          paddingHorizontal: SPACING.CARD_INNER_INSET,
        },
        optionRowSelected: {
          borderColor: colors.primary,
          backgroundColor: colors.accentLineSoft,
        },
        optionRadio: {
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: colors.border,
          marginRight: 12,
          alignItems: 'center',
          justifyContent: 'center',
        },
        optionRadioSelected: {
          borderColor: colors.primary,
        },
        optionRadioDot: {
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: colors.primary,
        },
        optionText: {
          flex: 1,
          color: colors.text,
          fontSize: 15,
          fontWeight: '500',
        },
        optionTextSelected: {
          color: colors.primary,
          fontWeight: '700',
        },
        errorText: {
          color: colors.error,
          marginTop: 10,
          textAlign: 'center',
          fontSize: 13,
          lineHeight: 18,
        },
        footer: {
          gap: SPACING.CHIP_INSET,
        },
        footerLinks: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: SPACING.sm,
        },
        footerLink: {
          paddingVertical: SPACING.xs,
          paddingHorizontal: 6,
        },
        footerLinkText: {
          color: colors.textSecondary,
          fontSize: 14,
          fontWeight: '600',
        },
        footerDivider: {
          color: colors.textSecondary,
          fontSize: 13,
        },
      }),
    [colors],
  );

  const finishFlow = async () => {
    try {
      await onCompleted?.();
    } catch (err) {
      console.warn('[OnboardingQuestions] No se pudo marcar onboarding completado:', err);
    } finally {
      onDismiss?.();
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    finishFlow();
  };

  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError(null);

    if (!focusChoice.trim()) {
      finishFlow();
      return;
    }

    setLoading(true);
    try {
      await api.patch(ENDPOINTS.ONBOARDING_PREFERENCES, {
        whatExpectFromApp: focusChoice.trim(),
        whatToImproveOrWorkOn: null,
        typeOfSpecialist: null,
      });
      showToast({ message: TEXTS.SAVE_SUCCESS, type: 'success' });
      await finishFlow();
    } catch (err) {
      setError(resolveOnboardingErrorMessage(err, TEXTS));
    } finally {
      setLoading(false);
    }
  };

  const handleExploreApp = async () => {
    Haptics.selectionAsync().catch(() => {});
    try {
      await onCompleted?.();
    } catch (err) {
      console.warn('[OnboardingQuestions] No se pudo marcar onboarding completado:', err);
    } finally {
      onExploreApp?.();
    }
  };

  const renderOptions = () => (
    <View style={styles.optionList}>
      {TEXTS.FOCUS_OPTIONS.map((option) => {
        const isSelected = focusChoice === option;
        return (
          <TouchableOpacity
            key={option}
            style={[styles.optionRow, isSelected && styles.optionRowSelected]}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setFocusChoice(isSelected ? '' : option);
            }}
            activeOpacity={0.85}
            disabled={loading}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
          >
            <View
              style={[styles.optionRadio, isSelected && styles.optionRadioSelected]}
            >
              {isSelected ? <View style={styles.optionRadioDot} /> : null}
            </View>
            <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const footer = (
    <View style={styles.footer}>
      <OnboardingGradientButton
        label={TEXTS.SUBMIT}
        onPress={handleSubmit}
        disabled={loading}
        loading={loading}
        variant="commit"
      />

      <View style={styles.footerLinks}>
        <TouchableOpacity
          style={styles.footerLink}
          onPress={handleSkip}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Text style={styles.footerLinkText}>{TEXTS.SKIP}</Text>
        </TouchableOpacity>
        {onExploreApp ? (
          <>
            <Text style={styles.footerDivider}>·</Text>
            <TouchableOpacity
              style={styles.footerLink}
              onPress={handleExploreApp}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.footerLinkText}>{TEXTS.EXPLORE_APP}</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleSkip}
    >
      <OnboardingBrandShell footer={footer} scroll>
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          <View style={styles.header}>
            <Text style={styles.title}>{TEXTS.TITLE}</Text>
            <Text style={styles.subtitle}>{TEXTS.SUBTITLE}</Text>
          </View>

          <OnboardingBenefitList
            heading={TEXTS.BENEFITS_HEADING}
            items={benefits}
          />

          <Text style={styles.label}>{TEXTS.MAIN_LABEL}</Text>
          {renderOptions()}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>
      </OnboardingBrandShell>
    </Modal>
  );
};

export default OnboardingQuestions;
