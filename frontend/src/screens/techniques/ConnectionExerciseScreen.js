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
import ParticleBackground from '../../components/ParticleBackground';
import { colors } from '../../styles/globalStyles';
import { techniqueScreenStyles } from './techniqueScreenStyles';

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
      <ParticleBackground />
      <Header
        title="Ejercicio de Conexión"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={techniqueScreenStyles.scrollContent}>
        <View style={techniqueScreenStyles.introPanel}>
          <Text style={techniqueScreenStyles.introKicker}>Relaciones</Text>
          <Text style={techniqueScreenStyles.introTitle}>Fortalece tus conexiones</Text>
          <Text style={techniqueScreenStyles.introText}>
            Las conexiones sociales son fundamentales para el bienestar. Estos ejercicios pueden ayudarte a fortalecer tus relaciones.
          </Text>
        </View>

        {CONNECTION_EXERCISES.map(exercise => {
          const isCompleted = completedExercises.includes(exercise.id);
          return (
            <View
              key={exercise.id}
              style={[
                techniqueScreenStyles.card,
                isCompleted && techniqueScreenStyles.cardCompleted,
              ]}
            >
              <View style={techniqueScreenStyles.rowHeader}>
                <View style={techniqueScreenStyles.iconTile}>
                  <MaterialCommunityIcons
                    name={exercise.icon}
                    size={28}
                    color={colors.primary}
                  />
                </View>
                <View style={techniqueScreenStyles.infoColumn}>
                  <Text style={techniqueScreenStyles.cardTitle}>{exercise.title}</Text>
                </View>
                {isCompleted && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={24}
                    color={colors.success}
                  />
                )}
              </View>
              <Text style={techniqueScreenStyles.cardBody}>{exercise.description}</Text>
              <TouchableOpacity
                style={[
                  techniqueScreenStyles.actionButton,
                  isCompleted && techniqueScreenStyles.actionButtonCompleted,
                ]}
                onPress={() => handleCompleteExercise(exercise.id)}
              >
                <Text
                  style={[
                    techniqueScreenStyles.actionButtonText,
                    isCompleted && techniqueScreenStyles.actionButtonTextCompleted,
                  ]}
                >
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
});

export default ConnectionExerciseScreen;
