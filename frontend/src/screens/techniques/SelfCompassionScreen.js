/**
 * Pantalla de Ejercicio de Autocompasión
 * Ejercicio interactivo guiado de autocompasión
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import { colors } from '../../styles/globalStyles';

const STEPS = [
  {
    id: 1,
    title: 'Reconocimiento',
    description: 'Reconoce que estás pasando por un momento difícil. ¿Qué estás sintiendo?',
    placeholder: 'Describe lo que estás sintiendo...',
    icon: 'heart',
  },
  {
    id: 2,
    title: 'Humanidad Común',
    description: 'Recuerda que todos pasamos por momentos difíciles. No estás solo en esto.',
    placeholder: 'Escribe sobre cómo otros también pasan por esto...',
    icon: 'account-group',
  },
  {
    id: 3,
    title: 'Amabilidad',
    description: 'Trátate con la misma amabilidad que tratarías a un buen amigo.',
    placeholder: '¿Qué le dirías a un amigo en esta situación?',
    icon: 'hand-heart',
  },
  {
    id: 4,
    title: 'Reflexión',
    description: 'Reflexiona sobre lo que has escrito y cómo puedes aplicarlo.',
    placeholder: 'Reflexiona sobre lo que has aprendido...',
    icon: 'lightbulb-on',
  },
];

const SelfCompassionScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({});
  const [currentResponse, setCurrentResponse] = useState('');

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  const handleNext = () => {
    if (currentResponse.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setResponses(prev => ({
        ...prev,
        [step.id]: currentResponse.trim(),
      }));
      setCurrentResponse('');

      if (isLastStep) {
        handleComplete();
      } else {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep(prev => prev - 1);
      setCurrentResponse(responses[STEPS[currentStep - 1].id] || '');
    }
  };

  const handleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      navigation.goBack();
    }, 1500);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <Header
        title="Ejercicio de Autocompasión"
        onBack={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Indicador de progreso */}
          <View style={styles.progressContainer}>
            {STEPS.map((s, index) => (
              <View
                key={s.id}
                style={[
                  styles.progressDot,
                  index <= currentStep && styles.progressDotActive,
                ]}
              />
            ))}
          </View>

          {/* Contenido del paso actual */}
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name={step.icon}
                size={48}
                color={colors.primary}
              />
            </View>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepDescription}>{step.description}</Text>

            <TextInput
              style={styles.input}
              placeholder={step.placeholder}
              placeholderTextColor={colors.textSecondary}
              value={currentResponse}
              onChangeText={setCurrentResponse}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            {/* Botones de navegación */}
            <View style={styles.buttonContainer}>
              {currentStep > 0 && (
                <TouchableOpacity
                  style={[styles.button, styles.backButton]}
                  onPress={handleBack}
                >
                  <Text style={styles.backButtonText}>Atrás</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.nextButton,
                  !currentResponse.trim() && styles.nextButtonDisabled,
                ]}
                onPress={handleNext}
                disabled={!currentResponse.trim()}
              >
                <Text style={styles.nextButtonText}>
                  {isLastStep ? 'Completar' : 'Siguiente'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  stepContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    minHeight: 150,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  nextButton: {
    backgroundColor: colors.primary,
  },
  nextButtonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default SelfCompassionScreen;

