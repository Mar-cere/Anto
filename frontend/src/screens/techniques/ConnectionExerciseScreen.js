/**
 * Pantalla de Ejercicio de Conexión
 * Ejercicios para mejorar las conexiones sociales y emocionales
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
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
import Header from '../../components/Header';
import { colors } from '../../styles/globalStyles';

const CONNECTION_EXERCISES = [
  {
    id: 1,
    title: 'Llamar a un ser querido',
    description: 'Tómate el tiempo para llamar a alguien que te importa. Una conversación puede hacer una gran diferencia.',
    action: 'Llamar',
    icon: 'phone',
  },
  {
    id: 2,
    title: 'Escribir una carta',
    description: 'Escribe una carta o mensaje a alguien que aprecias. Expresar gratitud fortalece las conexiones.',
    action: 'Escribir',
    icon: 'email',
  },
  {
    id: 3,
    title: 'Planificar una reunión',
    description: 'Planifica un encuentro con amigos o familia. Las conexiones en persona son muy valiosas.',
    action: 'Planificar',
    icon: 'calendar',
  },
  {
    id: 4,
    title: 'Compartir un recuerdo',
    description: 'Comparte un recuerdo positivo con alguien. Esto puede fortalecer vuestro vínculo.',
    action: 'Compartir',
    icon: 'share-variant',
  },
  {
    id: 5,
    title: 'Ofrecer ayuda',
    description: 'Ofrece tu ayuda a alguien que la necesite. Dar apoyo fortalece las relaciones.',
    action: 'Ayudar',
    icon: 'hand-heart',
  },
  {
    id: 6,
    title: 'Expresar aprecio',
    description: 'Dile a alguien lo que aprecias de él o ella. Las palabras de aprecio son poderosas.',
    action: 'Expresar',
    icon: 'heart',
  },
];

const ConnectionExerciseScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [completedExercises, setCompletedExercises] = useState([]);

  const handleCompleteExercise = (exerciseId) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (!completedExercises.includes(exerciseId)) {
      setCompletedExercises(prev => [...prev, exerciseId]);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <Header
        title="Ejercicio de Conexión"
        onBack={() => navigation.goBack()}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>🤝 Fortalece tus conexiones</Text>
          <Text style={styles.introText}>
            Las conexiones sociales son fundamentales para el bienestar. Estos ejercicios pueden ayudarte a fortalecer tus relaciones.
          </Text>
        </View>

        {CONNECTION_EXERCISES.map(exercise => {
          const isCompleted = completedExercises.includes(exercise.id);
          return (
            <View
              key={exercise.id}
              style={[
                styles.exerciseCard,
                isCompleted && styles.exerciseCardCompleted
              ]}
            >
              <View style={styles.exerciseHeader}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name={exercise.icon}
                    size={32}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                </View>
                {isCompleted && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={24}
                    color={colors.success}
                  />
                )}
              </View>
              <Text style={styles.exerciseDescription}>{exercise.description}</Text>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  isCompleted && styles.actionButtonCompleted
                ]}
                onPress={() => handleCompleteExercise(exercise.id)}
              >
                <Text style={styles.actionButtonText}>
                  {isCompleted ? 'Completado' : exercise.action}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
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
  },
  introContainer: {
    marginBottom: 30,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 10,
  },
  introText: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  exerciseCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseCardCompleted: {
    borderColor: colors.success,
    opacity: 0.8,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(26, 221, 219, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  exerciseDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  actionButtonCompleted: {
    backgroundColor: colors.success,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ConnectionExerciseScreen;

