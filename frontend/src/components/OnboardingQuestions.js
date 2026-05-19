/**
 * Preguntas iniciales de onboarding para personalizar el chat.
 * Modo sin teclado: selección por opciones para hacerlo más intuitivo.
 *
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api, ENDPOINTS } from '../config/api';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import { SPACING } from '../constants/ui';

const DEFAULT_TEXTS = {
  TITLE: 'Para adaptarte mejor',
  SUBTITLE: 'Tres preguntas cortas. Si no te encaja ninguna opción, puedes omitir.',
  Q1_LABEL: '¿Qué buscas aquí?',
  Q2_LABEL: '¿En qué te gustaría avanzar?',
  Q3_LABEL: '¿Cómo te gustaría que te acompañe?',
  SKIP: 'Omitir',
  SUBMIT: 'Listo',
  EXPLORE_APP: 'Ver recorrido de la app',
  SAVE_SUCCESS: 'Listo, gracias',
  SAVE_ERROR:
    'No se pudieron guardar las respuestas. Puedes omitir y seguir.',
  TOO_MANY_ATTEMPTS:
    'Demasiados intentos. Espera un momento y vuelve a intentar.',
  CONNECTION_ERROR:
    'No hay conexión. Verifica tu internet e inténtalo de nuevo.',
  OPTIONS_WHAT_EXPECT_FROM_APP: [
    'Apoyo emocional',
    'Ansiedad o estrés',
    'Hábitos y rutinas',
  ],
  OPTIONS_WHAT_TO_IMPROVE_OR_WORK_ON: [
    'Sueño y descanso',
    'Autoestima',
    'Enfoque y organización',
  ],
  OPTIONS_TYPE_OF_SPECIALIST: [
    'Paso a paso',
    'Escucha y compañía',
    'Ideas prácticas',
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
      Q1_LABEL: translated?.QUESTIONS_Q1_LABEL || DEFAULT_TEXTS.Q1_LABEL,
      Q2_LABEL: translated?.QUESTIONS_Q2_LABEL || DEFAULT_TEXTS.Q2_LABEL,
      Q3_LABEL: translated?.QUESTIONS_Q3_LABEL || DEFAULT_TEXTS.Q3_LABEL,
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
      OPTIONS_WHAT_EXPECT_FROM_APP:
        translated?.QUESTIONS_OPTIONS_WHAT_EXPECT_FROM_APP ||
        DEFAULT_TEXTS.OPTIONS_WHAT_EXPECT_FROM_APP,
      OPTIONS_WHAT_TO_IMPROVE_OR_WORK_ON:
        translated?.QUESTIONS_OPTIONS_WHAT_TO_IMPROVE_OR_WORK_ON ||
        DEFAULT_TEXTS.OPTIONS_WHAT_TO_IMPROVE_OR_WORK_ON,
      OPTIONS_TYPE_OF_SPECIALIST:
        translated?.QUESTIONS_OPTIONS_TYPE_OF_SPECIALIST ||
        DEFAULT_TEXTS.OPTIONS_TYPE_OF_SPECIALIST,
    }),
    [translated],
  );
  const { colors } = useTheme();
  const [whatExpectFromApp, setWhatExpectFromApp] = useState('');
  const [whatToImproveOrWorkOn, setWhatToImproveOrWorkOn] = useState('');
  const [typeOfSpecialist, setTypeOfSpecialist] = useState('');
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
          maxHeight: '92%',
        },
        header: {
          alignItems: 'center',
          marginBottom: 16,
        },
        iconCircle: {
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: colors.accentLineSoft,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 12,
        },
        title: {
          fontSize: 19,
          fontWeight: '700',
          color: colors.text,
          textAlign: 'center',
          marginBottom: 6,
        },
        subtitle: {
          fontSize: 13,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 19,
        },
        scroll: {
          maxHeight: 380,
        },
        scrollContent: {
          paddingBottom: 12,
        },
        field: {
          marginBottom: 14,
        },
        label: {
          color: colors.text,
          fontSize: 13,
          fontWeight: '700',
          marginBottom: 10,
        },
        optionList: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 10,
        },
        optionChip: {
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.glassFill,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingVertical: 10,
        },
        optionChipSelected: {
          borderColor: colors.primary,
          backgroundColor: colors.accentLineSoft,
        },
        optionChipText: {
          color: colors.text,
          fontSize: 13,
          fontWeight: '600',
        },
        optionChipTextSelected: {
          color: colors.primary,
        },
        errorText: {
          color: colors.error,
          marginTop: 8,
          marginBottom: 6,
          textAlign: 'center',
          fontSize: 13,
          lineHeight: 18,
        },
        actions: {
          marginTop: 16,
          gap: 10,
        },
        primaryButton: {
          backgroundColor: colors.primary,
          borderRadius: 14,
          paddingVertical: 14,
          alignItems: 'center',
        },
        primaryButtonText: {
          color: colors.textOnPrimary,
          fontSize: 14,
          fontWeight: '800',
          letterSpacing: 0.3,
        },
        skipButton: {
          borderRadius: 14,
          paddingVertical: 13,
          alignItems: 'center',
          backgroundColor: colors.glassFill,
          borderWidth: 1,
          borderColor: colors.border,
        },
        skipButtonText: {
          color: colors.textSecondary,
          fontSize: 13,
          fontWeight: '700',
        },
      }),
    [colors],
  );

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Promise.resolve(onCompleted?.())
      .catch((err) => {
        console.warn('[OnboardingQuestions] No se pudo marcar onboarding completado:', err);
      })
      .finally(() => {
        onDismiss?.();
      });
  };

  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError(null);
    const hasAny =
      whatExpectFromApp.trim() || whatToImproveOrWorkOn.trim() || typeOfSpecialist.trim();
    if (!hasAny) {
      try {
        await onCompleted?.();
      } catch (err) {
        console.warn('[OnboardingQuestions] No se pudo marcar onboarding completado:', err);
      } finally {
        onDismiss?.();
      }
      return;
    }

    setLoading(true);
    try {
      await api.patch(ENDPOINTS.ONBOARDING_PREFERENCES, {
        whatExpectFromApp: whatExpectFromApp.trim() || null,
        whatToImproveOrWorkOn: whatToImproveOrWorkOn.trim() || null,
        typeOfSpecialist: typeOfSpecialist.trim() || null,
      });
      showToast({ message: TEXTS.SAVE_SUCCESS, type: 'success' });
      try {
        await onCompleted?.();
      } catch (err) {
        console.warn('[OnboardingQuestions] No se pudo marcar onboarding completado:', err);
      } finally {
        onDismiss?.();
      }
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

  const renderOptionGroup = (label, value, setValue, options) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionList}>
        {options.map((option) => {
          const isSelected = value === option;
          return (
            <TouchableOpacity
              key={option}
              style={[styles.optionChip, isSelected && styles.optionChipSelected]}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setValue(isSelected ? '' : option);
              }}
              activeOpacity={0.85}
              disabled={loading}
            >
              <Text style={[styles.optionChipText, isSelected && styles.optionChipTextSelected]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
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
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="heart-outline" size={28} color={colors.primary} />
            </View>
            <Text style={styles.title}>{TEXTS.TITLE}</Text>
            <Text style={styles.subtitle}>{TEXTS.SUBTITLE}</Text>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderOptionGroup(
              TEXTS.Q1_LABEL,
              whatExpectFromApp,
              setWhatExpectFromApp,
              TEXTS.OPTIONS_WHAT_EXPECT_FROM_APP
            )}
            {renderOptionGroup(
              TEXTS.Q2_LABEL,
              whatToImproveOrWorkOn,
              setWhatToImproveOrWorkOn,
              TEXTS.OPTIONS_WHAT_TO_IMPROVE_OR_WORK_ON
            )}
            {renderOptionGroup(
              TEXTS.Q3_LABEL,
              typeOfSpecialist,
              setTypeOfSpecialist,
              TEXTS.OPTIONS_TYPE_OF_SPECIALIST
            )}

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
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.skipButtonText}>{TEXTS.SKIP}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleExploreApp}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.skipButtonText}>{TEXTS.EXPLORE_APP}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// `styles` se deriva del tema dentro del componente.

export default OnboardingQuestions;
