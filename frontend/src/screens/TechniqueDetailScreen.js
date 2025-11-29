/**
 * Pantalla de Detalle de Técnica Terapéutica
 * Muestra la guía completa paso a paso de una técnica
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import FloatingNavBar from '../components/FloatingNavBar';
import Header from '../components/Header';
import ParticleBackground from '../components/ParticleBackground';
import BreathingExercise from '../components/therapeutic/BreathingExercise';
import GroundingExercise from '../components/therapeutic/GroundingExercise';
import { api, ENDPOINTS } from '../config/api';
import { colors } from '../styles/globalStyles';

// Constantes de textos
const TEXTS = {
  START_EXERCISE: 'Comenzar Ejercicio',
  COMPLETE_EXERCISE: 'Ejercicio Completado',
  STEPS: 'Pasos',
  WHEN_TO_USE: 'Cuándo usar',
  DESCRIPTION: 'Descripción',
  TYPE: 'Tipo',
  PRACTICE: 'Practicar',
  MARK_COMPLETE: 'Marcar como completado',
};

// Técnicas que tienen ejercicios interactivos
const INTERACTIVE_TECHNIQUES = {
  'Respiración Consciente': 'breathing',
  'Grounding 5-4-3-2-1': 'grounding',
  'Respiración de Calma': 'breathing',
};

const TechniqueDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { technique } = route.params || {};

  const [showExercise, setShowExercise] = useState(false);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);

  if (!technique) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <Header title="Técnica" showBackButton />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Técnica no encontrada</Text>
        </View>
      </View>
    );
  }

  const exerciseType = INTERACTIVE_TECHNIQUES[technique.name];
  const hasInteractiveExercise = !!exerciseType;

  // Manejar inicio de ejercicio
  const handleStartExercise = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowExercise(true);
  };

  // Manejar completado de ejercicio
  const handleExerciseComplete = async (data) => {
    setExerciseCompleted(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Registrar uso de técnica en backend
    try {
      await api.post(ENDPOINTS.THERAPEUTIC_TECHNIQUES_USE, {
        techniqueId: technique.id || technique.name,
        completed: true,
        data: data || {},
      });
    } catch (error) {
      console.error('Error registrando uso de técnica:', error);
    }
  };

  // Renderizar ejercicio interactivo
  const renderExercise = () => {
    if (!showExercise) return null;

    if (exerciseType === 'breathing') {
      return (
        <View style={styles.exerciseContainer}>
          <BreathingExercise
            onComplete={handleExerciseComplete}
            cycles={5}
          />
        </View>
      );
    }

    if (exerciseType === 'grounding') {
      return (
        <View style={styles.exerciseContainer}>
          <GroundingExercise onComplete={handleExerciseComplete} />
        </View>
      );
    }

    return null;
  };

  // Renderizar contenido principal
  const renderContent = () => {
    if (showExercise && !exerciseCompleted) {
      return renderExercise();
    }

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header de la técnica */}
        <View style={styles.header}>
          <View style={[styles.typeBadge, { backgroundColor: `${colors.primary}20` }]}>
            <Text style={[styles.typeText, { color: colors.primary }]}>
              {technique.type || technique.category || 'Terapéutica'}
            </Text>
          </View>
          <Text style={styles.title}>{technique.name}</Text>
        </View>

        {/* Descripción */}
        {technique.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{TEXTS.DESCRIPTION}</Text>
            <Text style={styles.sectionContent}>{technique.description}</Text>
          </View>
        )}

        {/* Cuándo usar */}
        {technique.whenToUse && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons
                name="information"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.sectionTitle}>{TEXTS.WHEN_TO_USE}</Text>
            </View>
            <Text style={styles.sectionContent}>{technique.whenToUse}</Text>
          </View>
        )}

        {/* Pasos */}
        {technique.steps && technique.steps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{TEXTS.STEPS}</Text>
            {technique.steps.map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Técnicas DBT con sub-técnicas */}
        {technique.techniques && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Técnicas</Text>
            {Object.entries(technique.techniques).map(([key, subTechnique]) => (
              <View key={key} style={styles.subTechnique}>
                <Text style={styles.subTechniqueTitle}>{subTechnique.name}</Text>
                {subTechnique.steps && subTechnique.steps.map((step, index) => (
                  <View key={index} style={styles.stepItem}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Botón de ejercicio interactivo */}
        {hasInteractiveExercise && !exerciseCompleted && (
          <TouchableOpacity
            style={styles.exerciseButton}
            onPress={handleStartExercise}
          >
            <MaterialCommunityIcons
              name="play-circle"
              size={24}
              color={colors.white}
            />
            <Text style={styles.exerciseButtonText}>{TEXTS.START_EXERCISE}</Text>
          </TouchableOpacity>
        )}

        {/* Mensaje de completado */}
        {exerciseCompleted && (
          <View style={styles.completedContainer}>
            <MaterialCommunityIcons
              name="check-circle"
              size={48}
              color={colors.success}
            />
            <Text style={styles.completedText}>{TEXTS.COMPLETE_EXERCISE}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setShowExercise(false);
                setExerciseCompleted(false);
              }}
            >
              <Text style={styles.retryButtonText}>Practicar de nuevo</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ParticleBackground />
      <Header title={technique.name} showBackButton />
      {renderContent()}
      {!showExercise && <FloatingNavBar />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  subTechnique: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
  },
  subTechniqueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  exerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 10,
    marginTop: 20,
  },
  exerciseButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  exerciseContainer: {
    flex: 1,
    padding: 20,
  },
  completedContainer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  completedText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.success,
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
  },
});

export default TechniqueDetailScreen;

