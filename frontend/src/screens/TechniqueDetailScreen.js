/**
 * Pantalla de Detalle de Técnica Terapéutica
 * Muestra la guía completa paso a paso de una técnica
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FloatingNavBar from '../components/FloatingNavBar';
import Header from '../components/Header';
import ParticleBackground from '../components/ParticleBackground';
import BreathingExercise from '../components/therapeutic/BreathingExercise';
import GroundingExercise from '../components/therapeutic/GroundingExercise';
import { api, ENDPOINTS } from '../config/api';
import { useTheme } from '../context/ThemeContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import { getFocusTheme } from '../styles/focusCardTheme';
import { SPACING } from '../constants/ui';
import { resolveInteractiveExerciseType } from './therapeuticTechniques/therapeuticTechniquesUtils';
import { recordInterventionCompleted } from '../utils/recordInterventionCompleted';

// Constantes de textos
const DEFAULT_TEXTS = {
  START_EXERCISE: 'Comenzar Ejercicio',
  COMPLETE_EXERCISE: 'Ejercicio Completado',
  STEPS: 'Pasos',
  WHEN_TO_USE: 'Cuándo usar',
  DESCRIPTION: 'Descripción',
  TYPE: 'Tipo',
  PRACTICE: 'Practicar',
  MARK_COMPLETE: 'Marcar como completado',
  DEFAULT_HEADER_TITLE: 'Técnica',
  NOT_FOUND: 'Técnica no encontrada',
  BACK: 'Volver',
  THERAPEUTIC: 'Terapéutica',
  TECHNIQUES: 'Técnicas',
  PRACTICE_AGAIN: 'Practicar de nuevo',
};

const TechniqueDetailScreen = () => {
  const translated = useSectionTranslations('TECHNIQUES');
  const TEXTS = useMemo(
    () => ({
      ...DEFAULT_TEXTS,
      START_EXERCISE:
        translated?.DETAIL_START_EXERCISE || DEFAULT_TEXTS.START_EXERCISE,
      COMPLETE_EXERCISE:
        translated?.DETAIL_COMPLETE_EXERCISE || DEFAULT_TEXTS.COMPLETE_EXERCISE,
      STEPS: translated?.DETAIL_STEPS || DEFAULT_TEXTS.STEPS,
      WHEN_TO_USE: translated?.DETAIL_WHEN_TO_USE || DEFAULT_TEXTS.WHEN_TO_USE,
      DESCRIPTION:
        translated?.DETAIL_DESCRIPTION || DEFAULT_TEXTS.DESCRIPTION,
      TYPE: translated?.DETAIL_TYPE || DEFAULT_TEXTS.TYPE,
      PRACTICE: translated?.DETAIL_PRACTICE || DEFAULT_TEXTS.PRACTICE,
      MARK_COMPLETE:
        translated?.DETAIL_MARK_COMPLETE || DEFAULT_TEXTS.MARK_COMPLETE,
      DEFAULT_HEADER_TITLE:
        translated?.DETAIL_DEFAULT_HEADER_TITLE || DEFAULT_TEXTS.DEFAULT_HEADER_TITLE,
      NOT_FOUND: translated?.DETAIL_NOT_FOUND || DEFAULT_TEXTS.NOT_FOUND,
      BACK: translated?.DETAIL_BACK || DEFAULT_TEXTS.BACK,
      THERAPEUTIC:
        translated?.DETAIL_THERAPEUTIC || DEFAULT_TEXTS.THERAPEUTIC,
      TECHNIQUES: translated?.DETAIL_TECHNIQUES || DEFAULT_TEXTS.TECHNIQUES,
      PRACTICE_AGAIN:
        translated?.DETAIL_PRACTICE_AGAIN || DEFAULT_TEXTS.PRACTICE_AGAIN,
    }),
    [translated],
  );
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { technique } = route.params || {};
  const { colors, resolvedScheme, statusBarStyle } = useTheme();
  const t = useMemo(() => getFocusTheme(colors, resolvedScheme), [colors, resolvedScheme]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        scrollView: {
          flex: 1,
        },
        scrollContent: {
          padding: SPACING.SCREEN_EDGE_INSET,
        },
        header: {
          marginBottom: 22,
          ...t.FOCUS_PANEL,
        },
        typeBadge: {
          alignSelf: 'flex-start',
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingVertical: 6,
          borderRadius: 14,
          marginBottom: 12,
        },
        typeText: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
        },
        title: {
          fontSize: 22,
          fontWeight: '600',
          color: colors.text,
          lineHeight: 30,
          letterSpacing: 0.2,
        },
        section: {
          marginBottom: 20,
          ...t.FOCUS_PANEL,
        },
        sectionTitleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        },
        sectionTitle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: t.FOCUS_KICKER_COLOR,
          marginBottom: 12,
        },
        sectionContent: {
          fontSize: 16,
          color: t.FOCUS_META,
          lineHeight: 24,
          letterSpacing: 0.2,
        },
        stepItem: {
          flexDirection: 'row',
          marginBottom: 18,
          gap: 14,
          alignItems: 'flex-start',
        },
        stepNumber: {
          width: 32,
          height: 32,
          borderRadius: 12,
          backgroundColor: colors.accentLineSoft,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_ACCENT_BORDER,
          justifyContent: 'center',
          alignItems: 'center',
          flexShrink: 0,
        },
        stepNumberText: {
          fontSize: 15,
          fontWeight: '700',
          color: colors.primary,
        },
        stepText: {
          flex: 1,
          fontSize: 16,
          color: colors.text,
          lineHeight: 24,
          letterSpacing: 0.2,
        },
        subTechnique: {
          marginBottom: 16,
          padding: SPACING.SCREEN_EDGE_INSET,
          backgroundColor: colors.glassFill,
          borderRadius: 14,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
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
          backgroundColor: colors.accentLineSoft,
          paddingVertical: 16,
          paddingHorizontal: 24,
          borderRadius: 16,
          gap: 12,
          marginTop: 8,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_ACCENT_BORDER,
        },
        exerciseButtonText: {
          fontSize: 17,
          fontWeight: '600',
          color: colors.text,
        },
        exerciseContainer: {
          flex: 1,
          padding: SPACING.SCREEN_EDGE_INSET,
        },
        completedContainer: {
          alignItems: 'center',
          padding: SPACING.SCREEN_EDGE_INSET,
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
          borderRadius: 14,
          backgroundColor: colors.accentLineSoft,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_ACCENT_BORDER,
        },
        retryButtonText: {
          fontSize: 16,
          fontWeight: '600',
          color: colors.text,
        },
        errorContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: SPACING.SCREEN_EDGE_INSET,
          gap: 16,
        },
        errorText: {
          fontSize: 18,
          color: colors.error,
          textAlign: 'center',
          fontWeight: '600',
        },
      }),
    [colors, t],
  );

  const [showExercise, setShowExercise] = useState(false);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);

  if (!technique) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
        <ParticleBackground />
        <Header title={TEXTS.DEFAULT_HEADER_TITLE} showBackButton />
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorText}>{TEXTS.NOT_FOUND}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>{TEXTS.BACK}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const exerciseType = resolveInteractiveExerciseType(technique);
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
    
    // Calcular duración si está disponible
    const duration = data?.duration || null;
    
    // Registrar uso de técnica en backend
    try {
      await api.post(ENDPOINTS.THERAPEUTIC_TECHNIQUES_USE, {
        techniqueId: technique.id || technique.name,
        techniqueName: technique.name,
        techniqueType: technique.type || technique.category || 'immediate',
        emotion: technique.emotion || null,
        completed: true,
        duration: duration,
        exerciseData: data || {},
        completedAt: new Date().toISOString(),
      });

      // #127: cerrar loop sugerencia → completado (best-effort, sin romper UX)
      try {
        const completionInterventionId =
          exerciseType === 'breathing'
            ? 'breathing_exercise'
            : exerciseType === 'grounding'
              ? 'grounding_technique'
              : technique.id || technique.name;
        recordInterventionCompleted(completionInterventionId);
      } catch (_) {}
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
        contentContainerStyle={[
          styles.scrollContent,
          !showExercise
            ? { paddingBottom: insets.bottom + SPACING.FLOATING_NAV_SCROLL_BOTTOM_EXTRA }
            : { paddingBottom: insets.bottom + SPACING.SCREEN_EDGE_INSET },
        ]}
      >
        {/* Header de la técnica */}
        <View style={styles.header}>
          <View style={[styles.typeBadge, { backgroundColor: `${colors.primary}20` }]}>
            <Text style={[styles.typeText, { color: colors.primary }]}>
              {technique.type || technique.category || TEXTS.THERAPEUTIC}
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
            <Text style={styles.sectionTitle}>{TEXTS.TECHNIQUES}</Text>
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
              <Text style={styles.retryButtonText}>{TEXTS.PRACTICE_AGAIN}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <ParticleBackground />
      <Header title={technique.name} showBackButton />
      {renderContent()}
      {!showExercise && <FloatingNavBar />}
    </SafeAreaView>
  );
};

export default TechniqueDetailScreen;

