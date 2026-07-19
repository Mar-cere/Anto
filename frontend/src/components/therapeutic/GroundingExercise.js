/**
 * Componente de Ejercicio de Grounding 5-4-3-2-1
 * Ejercicio interactivo guiado de grounding
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import {
  getFocusTheme,
} from '../../styles/focusCardTheme';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { SPACING } from '../../constants/ui';

// Constantes de textos
const DEFAULT_TEXTS = {
  TITLE: 'Ejercicio de Grounding 5-4-3-2-1',
  DESCRIPTION: 'Este ejercicio te ayuda a conectarte con el presente usando tus sentidos. Identifica elementos de tu entorno para cada categoría.',
  INSTRUCTION: 'Escribe lo que identificas para cada categoría:',
  COMPLETE: 'Completar',
  RESET: 'Reiniciar',
  COMPLETED: '¡Ejercicio completado!',
  NEXT: 'Siguiente',
  PLACEHOLDER: 'Escribe aquí...',
  COMPLETED_SUMMARY_PREFIX: 'Has identificado',
  COMPLETED_SUMMARY_SUFFIX: 'elementos usando tus sentidos.',
  CATEGORY_SEE: '5 cosas que puedes VER',
  CATEGORY_TOUCH: '4 cosas que puedes TOCAR',
  CATEGORY_HEAR: '3 cosas que puedes OÍR',
  CATEGORY_SMELL: '2 cosas que puedes OLER',
  CATEGORY_TASTE: '1 cosa que puedes SABOREAR',
};

const GroundingExercise = ({ onComplete }) => {
  const translated = useSectionTranslations('TECHNIQUES');
  const TEXTS = useMemo(
    () => ({
      ...DEFAULT_TEXTS,
      TITLE:
        translated?.GROUNDING_EXERCISE_TITLE || DEFAULT_TEXTS.TITLE,
      DESCRIPTION:
        translated?.GROUNDING_EXERCISE_DESCRIPTION || DEFAULT_TEXTS.DESCRIPTION,
      INSTRUCTION:
        translated?.GROUNDING_EXERCISE_INSTRUCTION || DEFAULT_TEXTS.INSTRUCTION,
      COMPLETE:
        translated?.GROUNDING_EXERCISE_COMPLETE || DEFAULT_TEXTS.COMPLETE,
      RESET: translated?.GROUNDING_EXERCISE_RESET || DEFAULT_TEXTS.RESET,
      COMPLETED:
        translated?.GROUNDING_EXERCISE_COMPLETED || DEFAULT_TEXTS.COMPLETED,
      NEXT: translated?.GROUNDING_EXERCISE_NEXT || DEFAULT_TEXTS.NEXT,
      PLACEHOLDER:
        translated?.GROUNDING_EXERCISE_PLACEHOLDER || DEFAULT_TEXTS.PLACEHOLDER,
      COMPLETED_SUMMARY_PREFIX:
        translated?.GROUNDING_EXERCISE_COMPLETED_SUMMARY_PREFIX ||
        DEFAULT_TEXTS.COMPLETED_SUMMARY_PREFIX,
      COMPLETED_SUMMARY_SUFFIX:
        translated?.GROUNDING_EXERCISE_COMPLETED_SUMMARY_SUFFIX ||
        DEFAULT_TEXTS.COMPLETED_SUMMARY_SUFFIX,
      CATEGORY_SEE:
        translated?.GROUNDING_EXERCISE_CATEGORY_SEE ||
        DEFAULT_TEXTS.CATEGORY_SEE,
      CATEGORY_TOUCH:
        translated?.GROUNDING_EXERCISE_CATEGORY_TOUCH ||
        DEFAULT_TEXTS.CATEGORY_TOUCH,
      CATEGORY_HEAR:
        translated?.GROUNDING_EXERCISE_CATEGORY_HEAR ||
        DEFAULT_TEXTS.CATEGORY_HEAR,
      CATEGORY_SMELL:
        translated?.GROUNDING_EXERCISE_CATEGORY_SMELL ||
        DEFAULT_TEXTS.CATEGORY_SMELL,
      CATEGORY_TASTE:
        translated?.GROUNDING_EXERCISE_CATEGORY_TASTE ||
        DEFAULT_TEXTS.CATEGORY_TASTE,
    }),
    [translated],
  );
  const { colors, resolvedScheme } = useTheme();
  const t = useMemo(() => getFocusTheme(colors, resolvedScheme), [colors, resolvedScheme]);
  const CATEGORIES = useMemo(
    () => [
      { key: 'see', label: TEXTS.CATEGORY_SEE, icon: 'eye', color: colors.primary },
      { key: 'touch', label: TEXTS.CATEGORY_TOUCH, icon: 'hand-back-left', color: colors.success },
      { key: 'hear', label: TEXTS.CATEGORY_HEAR, icon: 'ear-hearing', color: colors.warning },
      { key: 'smell', label: TEXTS.CATEGORY_SMELL, icon: 'nose', color: colors.error },
      { key: 'taste', label: TEXTS.CATEGORY_TASTE, icon: 'food', color: colors.accent },
    ],
    [TEXTS, colors],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: 'transparent',
        },
        scrollView: {
          flex: 1,
        },
        scrollContent: {
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingTop: SPACING.sm,
          paddingBottom: SPACING.xxl,
        },
        title: {
          fontSize: 22,
          fontWeight: '700',
          color: colors.text,
          marginBottom: 10,
          letterSpacing: 0.3,
        },
        description: {
          fontSize: 15,
          color: t.FOCUS_META,
          lineHeight: 22,
          marginBottom: 22,
          letterSpacing: 0.2,
        },
        progressContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 30,
          paddingHorizontal: SPACING.CHIP_INSET_COMPACT,
        },
        progressDot: {
          width: 12,
          height: 12,
          borderRadius: 6,
        },
        progressDotActive: {
          width: 16,
          height: 16,
          borderRadius: 8,
        },
        progressDotCompleted: {},
        categoryCard: {
          backgroundColor: colors.cardBackground,
          borderRadius: 22,
          borderWidth: StyleSheet.hairlineWidth * 2,
          overflow: 'hidden',
        },
        categoryHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: SPACING.CARD_INNER_INSET,
          gap: SPACING.CHIP_INSET,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: t.FOCUS_BORDER_SUBTLE,
        },
        categoryTitle: {
          fontSize: 18,
          fontWeight: '600',
        },
        responsesContainer: {
          padding: SPACING.CARD_INNER_INSET,
          gap: SPACING.CARD_INNER_INSET,
        },
        responseItem: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: SPACING.CARD_INNER_INSET,
          backgroundColor: colors.glassFill,
          borderRadius: 14,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
        },
        responseText: {
          fontSize: 14,
          color: colors.text,
          flex: 1,
        },
        removeButton: {
          marginLeft: 10,
        },
        inputContainer: {
          flexDirection: 'row',
          padding: SPACING.CARD_INNER_INSET,
          gap: SPACING.CARD_INNER_INSET,
        },
        input: {
          flex: 1,
          backgroundColor: colors.chromeInput,
          borderRadius: 14,
          padding: SPACING.INPUT_INSET,
          fontSize: 15,
          color: colors.text,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
          minHeight: 48,
        },
        addButton: {
          width: 48,
          height: 48,
          borderRadius: 14,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_ACCENT_BORDER,
        },
        nextButton: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          padding: SPACING.HERO_INSET,
          gap: SPACING.CARD_INNER_INSET,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
        },
        nextButtonText: {
          fontSize: 16,
          fontWeight: '600',
          color: colors.textOnPrimary,
        },
        completedContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: SPACING.SCREEN_EDGE_INSET,
        },
        completedTitle: {
          fontSize: 22,
          fontWeight: '700',
          color: colors.text,
          marginTop: 20,
          marginBottom: 10,
        },
        completedText: {
          fontSize: 15,
          color: t.FOCUS_META,
          textAlign: 'center',
          marginBottom: 30,
          lineHeight: 22,
        },
        resetButton: {
          paddingHorizontal: SPACING.CHIP_INSET,
          paddingVertical: SPACING.CHIP_INSET,
          borderRadius: 14,
          backgroundColor: colors.primary,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_ACCENT_BORDER,
        },
        resetButtonText: {
          fontSize: 16,
          fontWeight: '600',
          color: colors.textOnPrimary,
        },
      }),
    [colors, t],
  );
  const [responses, setResponses] = useState({
    see: [],
    touch: [],
    hear: [],
    smell: [],
    taste: [],
  });
  const [currentInput, setCurrentInput] = useState('');
  const [currentCategory, setCurrentCategory] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Obtener categoría actual
  const currentCat = CATEGORIES[currentCategory];
  const currentResponses = responses[currentCat.key];
  const requiredCount = parseInt(currentCat.label.split(' ')[0]);

  // Verificar si la categoría está completa
  const isCategoryComplete = currentResponses.length >= requiredCount;

  // Agregar respuesta
  const handleAddResponse = () => {
    if (!currentInput.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setResponses(prev => ({
      ...prev,
      [currentCat.key]: [...prev[currentCat.key], currentInput.trim()],
    }));
    setCurrentInput('');

    // Si la categoría está completa, avanzar automáticamente
    if (currentResponses.length + 1 >= requiredCount) {
      setTimeout(() => {
        if (currentCategory < CATEGORIES.length - 1) {
          setCurrentCategory(prev => prev + 1);
        } else {
          handleComplete();
        }
      }, 500);
    }
  };

  // Eliminar respuesta
  const handleRemoveResponse = (index) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setResponses(prev => ({
      ...prev,
      [currentCat.key]: prev[currentCat.key].filter((_, i) => i !== index),
    }));
  };

  // Avanzar a siguiente categoría
  const handleNext = () => {
    if (currentCategory < CATEGORIES.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCurrentCategory(prev => prev + 1);
      setCurrentInput('');
    } else {
      handleComplete();
    }
  };

  // Completar ejercicio
  const handleComplete = () => {
    setIsCompleted(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (onComplete) {
      setTimeout(() => onComplete(responses), 1000);
    }
  };

  // Reiniciar ejercicio
  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setResponses({
      see: [],
      touch: [],
      hear: [],
      smell: [],
      taste: [],
    });
    setCurrentInput('');
    setCurrentCategory(0);
    setIsCompleted(false);
  };

  if (isCompleted) {
    return (
      <View style={styles.completedContainer}>
        <MaterialCommunityIcons
          name="check-circle"
          size={64}
          color={colors.success}
        />
        <Text style={styles.completedTitle}>{TEXTS.COMPLETED}</Text>
        <Text style={styles.completedText}>
          {TEXTS.COMPLETED_SUMMARY_PREFIX} {Object.values(responses).flat().length}{' '}
          {TEXTS.COMPLETED_SUMMARY_SUFFIX}
        </Text>
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>{TEXTS.RESET}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{TEXTS.TITLE}</Text>
        <Text style={styles.description}>{TEXTS.DESCRIPTION}</Text>

      {/* Indicador de progreso */}
      <View style={styles.progressContainer}>
        {CATEGORIES.map((cat, index) => (
          <View
            key={cat.key}
            style={[
              styles.progressDot,
              index === currentCategory && styles.progressDotActive,
              index < currentCategory && styles.progressDotCompleted,
              {
                backgroundColor:
                  index <= currentCategory ? cat.color : 'rgba(255,255,255,0.12)',
              },
            ]}
          />
        ))}
      </View>

      {/* Categoría actual */}
      <View style={[styles.categoryCard, { borderColor: currentCat.color }]}>
        <View style={[styles.categoryHeader, { backgroundColor: `${currentCat.color}20` }]}>
          <MaterialCommunityIcons
            name={currentCat.icon}
            size={24}
            color={currentCat.color}
          />
          <Text style={[styles.categoryTitle, { color: currentCat.color }]}>
            {currentCat.label}
          </Text>
        </View>

        {/* Respuestas actuales */}
        <View style={styles.responsesContainer}>
          {currentResponses.map((response, index) => (
            <View key={index} style={styles.responseItem}>
              <Text style={styles.responseText}>{response}</Text>
              <TouchableOpacity
                onPress={() => handleRemoveResponse(index)}
                style={styles.removeButton}
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={20}
                  color={colors.error}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Input para nueva respuesta */}
        {!isCategoryComplete && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={TEXTS.PLACEHOLDER}
              placeholderTextColor={colors.textSecondary}
              value={currentInput}
              onChangeText={setCurrentInput}
              onSubmitEditing={handleAddResponse}
            />
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: currentCat.color }]}
              onPress={handleAddResponse}
            >
              <MaterialCommunityIcons name="plus" size={20} color={colors.textOnPrimary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Botón siguiente */}
        {isCategoryComplete && (
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: currentCat.color }]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {currentCategory < CATEGORIES.length - 1 ? TEXTS.NEXT : TEXTS.COMPLETE}
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color={colors.textOnPrimary} />
          </TouchableOpacity>
        )}
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
// `styles` se crea por tema dentro del componente.

export default GroundingExercise;

