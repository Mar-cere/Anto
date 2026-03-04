/**
 * Preguntas iniciales de onboarding para personalizar el chat.
 * Las respuestas se envían al backend y Anto las usa en la conversación.
 *
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { api, ENDPOINTS } from '../config/api';
import { colors } from '../styles/globalStyles';

const TEXTS = {
  TITLE: 'Un momento para conocerte',
  SUBTITLE: 'Tus respuestas ayudan a Anto a acompañarte mejor. Puedes omitir si prefieres.',
  Q1_LABEL: '¿Qué esperas de la app?',
  Q1_PLACEHOLDER: 'Ej. apoyo emocional, organizarme, trabajar la ansiedad…',
  Q2_LABEL: '¿Qué te gustaría mejorar o trabajar?',
  Q2_PLACEHOLDER: 'Ej. sueño, rutinas, autoestima, estrés…',
  Q3_LABEL: '¿Qué tipo de apoyo buscas?',
  Q3_PLACEHOLDER: 'Ej. más guía, alguien que escuche, más práctico…',
  SKIP: 'Omitir',
  SUBMIT: 'Enviar',
};

const OnboardingQuestions = ({ visible, onDismiss }) => {
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
    const hasAny = whatExpectFromApp.trim() || whatToImproveOrWorkOn.trim() || typeOfSpecialist.trim();
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
      onDismiss?.();
    } catch (err) {
      setError(err?.message || 'No se pudieron guardar las respuestas. Puedes omitir y seguir.');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
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
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.field}>
                <Text style={styles.label}>{TEXTS.Q1_LABEL}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={TEXTS.Q1_PLACEHOLDER}
                  placeholderTextColor={colors.textSecondary}
                  value={whatExpectFromApp}
                  onChangeText={setWhatExpectFromApp}
                  multiline
                  maxLength={500}
                  editable={!loading}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>{TEXTS.Q2_LABEL}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={TEXTS.Q2_PLACEHOLDER}
                  placeholderTextColor={colors.textSecondary}
                  value={whatToImproveOrWorkOn}
                  onChangeText={setWhatToImproveOrWorkOn}
                  multiline
                  maxLength={500}
                  editable={!loading}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>{TEXTS.Q3_LABEL}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={TEXTS.Q3_PLACEHOLDER}
                  placeholderTextColor={colors.textSecondary}
                  value={typeOfSpecialist}
                  onChangeText={setTypeOfSpecialist}
                  multiline
                  maxLength={500}
                  editable={!loading}
                />
              </View>

              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : null}

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
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  keyboardView: {
    maxHeight: '90%',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    maxHeight: '90%',
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
  scroll: {
    maxHeight: 400,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.textSecondary + '40',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
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
