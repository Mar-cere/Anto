/**
 * Preferencia inicial de onboarding (una sola elección opcional).
 * Se persiste en UserProfile.onboardingAnswers.whatExpectFromApp y el chat
 * la inyecta en el system prompt (buildOnboardingAnswersSystemSnippet).
 */
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { api, ENDPOINTS } from '../config/api';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import { SPACING } from '../constants/ui';

const DEFAULT_TEXTS = {
  TITLE: 'Cuéntame en qué enfocarnos',
  SUBTITLE: 'Opcional. Elige una opción o omite.',
  MAIN_LABEL: 'Ahora mismo me interesa más…',
  SKIP: 'Omitir',
  SUBMIT: 'Continuar',
  EXPLORE_APP: 'Ver recorrido',
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

const UI = {
  OVERLAY: 'rgba(0,0,0,0.6)',
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
  const { colors } = useTheme();
  const [focusChoice, setFocusChoice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: UI.OVERLAY,
          justifyContent: 'center',
          padding: SPACING.SCREEN_EDGE_INSET,
        },
        card: {
          backgroundColor: colors.modalSurface ?? colors.chromeCard,
          borderWidth: 1,
          borderColor: colors.accentLine,
          borderRadius: 16,
          padding: SPACING.SCREEN_EDGE_INSET,
        },
        header: {
          marginBottom: 18,
        },
        title: {
          fontSize: 20,
          fontWeight: '700',
          color: colors.text,
          textAlign: 'center',
          marginBottom: 6,
        },
        subtitle: {
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 20,
        },
        label: {
          color: colors.textSecondary,
          fontSize: 13,
          fontWeight: '600',
          marginBottom: 10,
        },
        optionList: {
          gap: 8,
        },
        optionRow: {
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.glassFill,
          paddingVertical: 12,
          paddingHorizontal: 14,
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
          fontWeight: '600',
        },
        errorText: {
          color: colors.error,
          marginTop: 10,
          textAlign: 'center',
          fontSize: 13,
          lineHeight: 18,
        },
        actions: {
          marginTop: 20,
          gap: 12,
        },
        primaryButton: {
          backgroundColor: colors.primary,
          borderRadius: 14,
          paddingVertical: 14,
          alignItems: 'center',
        },
        primaryButtonText: {
          color: colors.textOnPrimary,
          fontSize: 15,
          fontWeight: '700',
        },
        footerLinks: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        },
        footerLink: {
          paddingVertical: 4,
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

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{TEXTS.TITLE}</Text>
            <Text style={styles.subtitle}>{TEXTS.SUBTITLE}</Text>
          </View>

          <Text style={styles.label}>{TEXTS.MAIN_LABEL}</Text>
          {renderOptions()}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.textOnPrimary} size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>{TEXTS.SUBMIT}</Text>
              )}
            </TouchableOpacity>

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
        </View>
      </View>
    </Modal>
  );
};

export default OnboardingQuestions;
