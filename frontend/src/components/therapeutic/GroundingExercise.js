/**
 * Componente de Ejercicio de Grounding 5-4-3-2-1
 * Ejercicio interactivo guiado de grounding
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { colors } from '../../styles/globalStyles';

// Constantes de categorías
const CATEGORIES = [
  { key: 'see', label: '5 cosas que puedes VER', icon: 'eye', color: colors.primary },
  { key: 'touch', label: '4 cosas que puedes TOCAR', icon: 'hand-back-left', color: colors.success },
  { key: 'hear', label: '3 cosas que puedes OÍR', icon: 'ear-hearing', color: colors.warning },
  { key: 'smell', label: '2 cosas que puedes OLER', icon: 'nose', color: colors.error },
  { key: 'taste', label: '1 cosa que puedes SABOREAR', icon: 'food', color: colors.accent },
];

// Constantes de textos
const TEXTS = {
  TITLE: 'Ejercicio de Grounding 5-4-3-2-1',
  DESCRIPTION: 'Este ejercicio te ayuda a conectarte con el presente usando tus sentidos. Identifica elementos de tu entorno para cada categoría.',
  INSTRUCTION: 'Escribe lo que identificas para cada categoría:',
  COMPLETE: 'Completar',
  RESET: 'Reiniciar',
  COMPLETED: '¡Ejercicio completado!',
  NEXT: 'Siguiente',
  PLACEHOLDER: 'Escribe aquí...',
};

const GroundingExercise = ({ onComplete }) => {
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

  // Verificar si todo está completo
  const isAllComplete = CATEGORIES.every(cat => 
    responses[cat.key].length >= parseInt(cat.label.split(' ')[0])
  );

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
          Has identificado {Object.values(responses).flat().length} elementos usando tus sentidos.
        </Text>
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>{TEXTS.RESET}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
              { backgroundColor: index <= currentCategory ? cat.color : colors.border },
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
              <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
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
            <MaterialCommunityIcons name="arrow-right" size={20} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
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
  },
  progressDotActive: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  progressDotCompleted: {
    // Ya tiene el color de la categoría
  },
  categoryCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  responsesContainer: {
    padding: 16,
    gap: 10,
  },
  responseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
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
    padding: 16,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  completedText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  resetButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default GroundingExercise;

