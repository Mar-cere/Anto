/**
 * Preguntas iniciales de onboarding para personalizar el chat.
 * Modo sin teclado: selección por opciones para hacerlo más intuitivo.
 *
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { api, ENDPOINTS } from '../config/api';
import { useToast } from '../context/ToastContext';
import { colors } from '../styles/globalStyles';
import { getApiErrorMessage } from '../utils/apiErrorHandler';

const TEXTS = {
  TITLE: 'Para adaptarte mejor',
  SUBTITLE: 'Tres preguntas cortas. Si no te encaja nada, podés omitir.',
  Q1_LABEL: '¿Qué buscás acá?',
  Q2_LABEL: '¿En qué te gustaría avanzar?',
  Q3_LABEL: '¿Cómo te gustaría que te acompañe?',
  SKIP: 'Omitir',
  SUBMIT: 'Listo',
};

const OPTIONS = {
  whatExpectFromApp: ['Apoyo emocional', 'Ansiedad o estrés', 'Hábitos y rutinas'],
  whatToImproveOrWorkOn: ['Sueño y descanso', 'Autoestima', 'Enfoque y organización'],
  typeOfSpecialist: ['Paso a paso', 'Escucha y compañía', 'Ideas prácticas'],
};

const UI = {
  CARD_BACKGROUND: '#122052',
  CARD_BORDER: 'rgba(26, 221, 219, 0.25)',
  OVERLAY: 'rgba(0,0,0,0.6)',
};

const OnboardingQuestions = ({ visible, onDismiss }) => {
  const { showToast } = useToast();
  const [whatExpectFromApp, setWhatExpectFromApp] = useState('');
  const [whatToImproveOrWorkOn, setWhatToImproveOrWorkOn] = useState('');
  const [typeOfSpecialist, setTypeOfSpecialist] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss?.();
  };

  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError(null);
    const hasAny =
      whatExpectFromApp.trim() || whatToImproveOrWorkOn.trim() || typeOfSpecialist.trim();
    if (!hasAny) {
      onDismiss?.();
      return;
    }

    setLoading(true);
    try {
      await api.patch(ENDPOINTS.ONBOARDING_PREFERENCES, {
        whatExpectFromApp: whatExpectFromApp.trim() || null,
        whatToImproveOrWorkOn: whatToImproveOrWorkOn.trim() || null,
        typeOfSpecialist: typeOfSpecialist.trim() || null,
      });
      showToast({ message: 'Listo, gracias', type: 'success' });
      onDismiss?.();
    } catch (err) {
      setError(getApiErrorMessage(err) || 'No se pudieron guardar las respuestas. Puedes omitir y seguir.');
    } finally {
      setLoading(false);
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
              OPTIONS.whatExpectFromApp
            )}
            {renderOptionGroup(
              TEXTS.Q2_LABEL,
              whatToImproveOrWorkOn,
              setWhatToImproveOrWorkOn,
              OPTIONS.whatToImproveOrWorkOn
            )}
            {renderOptionGroup(
              TEXTS.Q3_LABEL,
              typeOfSpecialist,
              setTypeOfSpecialist,
              OPTIONS.typeOfSpecialist
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
                  <ActivityIndicator color={colors.white} size="small" />
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
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: UI.OVERLAY,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: UI.CARD_BACKGROUND,
    borderWidth: 1,
    borderColor: UI.CARD_BORDER,
    borderRadius: 16,
    padding: 20,
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
    backgroundColor: colors.primary + '22',
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
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  optionList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    borderWidth: 1,
    borderColor: colors.textSecondary + '40',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '22',
  },
  optionChipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  optionChipTextSelected: {
    color: colors.primary,
  },
  errorText: {
    fontSize: 13,
    color: colors.error || '#c62828',
    marginBottom: 12,
    textAlign: 'center',
  },
  actions: {
    gap: 10,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
});

export default OnboardingQuestions;
