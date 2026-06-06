/**
 * Pantalla de Ejercicio de Conexión
 * Ejercicios para mejorar las conexiones sociales y emocionales
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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
import Header from '../../components/Header';
import ParticleBackground from '../../components/ParticleBackground';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { createInterventionCompletedRecorder } from '../../utils/recordInterventionCompleted';
import { useTechniqueScreenStyles } from './techniqueScreenStyles';

const DEFAULT_TEXTS = {
  TITLE: 'Ejercicio de Conexion',
  INTRO_KICKER: 'Relaciones',
  INTRO_TITLE: 'Fortalece tus conexiones',
  INTRO_BODY:
    'Las conexiones sociales son fundamentales para el bienestar. Estos ejercicios pueden ayudarte a fortalecer tus relaciones.',
  COMPLETED: 'Completado',
  ITEM_1_TITLE: 'Llamar a un ser querido',
  ITEM_1_DESC:
    'Tomate el tiempo para llamar a alguien que te importa. Una conversacion puede hacer una gran diferencia.',
  ITEM_1_ACTION: 'Llamar',
  ITEM_2_TITLE: 'Escribir una carta',
  ITEM_2_DESC:
    'Escribe una carta o mensaje a alguien que aprecias. Expresar gratitud fortalece las conexiones.',
  ITEM_2_ACTION: 'Escribir',
  ITEM_3_TITLE: 'Planificar una reunion',
  ITEM_3_DESC:
    'Planifica un encuentro con amigos o familia. Las conexiones en persona son muy valiosas.',
  ITEM_3_ACTION: 'Planificar',
  ITEM_4_TITLE: 'Compartir un recuerdo',
  ITEM_4_DESC:
    'Comparte un recuerdo positivo con alguien. Esto puede fortalecer vuestro vinculo.',
  ITEM_4_ACTION: 'Compartir',
  ITEM_5_TITLE: 'Ofrecer ayuda',
  ITEM_5_DESC:
    'Ofrece tu ayuda a alguien que la necesite. Dar apoyo fortalece las relaciones.',
  ITEM_5_ACTION: 'Ayudar',
  ITEM_6_TITLE: 'Expresar aprecio',
  ITEM_6_DESC:
    'Dile a alguien lo que aprecias de el o ella. Las palabras de aprecio son poderosas.',
  ITEM_6_ACTION: 'Expresar',
};

const ConnectionExerciseScreen = () => {
  const translated = useSectionTranslations('TECHNIQUES');
  const TEXTS = useMemo(
    () => ({
      TITLE: translated?.CONNECTION_TITLE || DEFAULT_TEXTS.TITLE,
      INTRO_KICKER:
        translated?.CONNECTION_INTRO_KICKER || DEFAULT_TEXTS.INTRO_KICKER,
      INTRO_TITLE:
        translated?.CONNECTION_INTRO_TITLE || DEFAULT_TEXTS.INTRO_TITLE,
      INTRO_BODY:
        translated?.CONNECTION_INTRO_BODY ||
        DEFAULT_TEXTS.INTRO_BODY,
      COMPLETED: translated?.CONNECTION_COMPLETED || DEFAULT_TEXTS.COMPLETED,
      ITEM_1_TITLE:
        translated?.CONNECTION_ITEM_1_TITLE || DEFAULT_TEXTS.ITEM_1_TITLE,
      ITEM_1_DESC:
        translated?.CONNECTION_ITEM_1_DESC ||
        DEFAULT_TEXTS.ITEM_1_DESC,
      ITEM_1_ACTION:
        translated?.CONNECTION_ITEM_1_ACTION || DEFAULT_TEXTS.ITEM_1_ACTION,
      ITEM_2_TITLE:
        translated?.CONNECTION_ITEM_2_TITLE || DEFAULT_TEXTS.ITEM_2_TITLE,
      ITEM_2_DESC:
        translated?.CONNECTION_ITEM_2_DESC ||
        DEFAULT_TEXTS.ITEM_2_DESC,
      ITEM_2_ACTION:
        translated?.CONNECTION_ITEM_2_ACTION || DEFAULT_TEXTS.ITEM_2_ACTION,
      ITEM_3_TITLE:
        translated?.CONNECTION_ITEM_3_TITLE || DEFAULT_TEXTS.ITEM_3_TITLE,
      ITEM_3_DESC:
        translated?.CONNECTION_ITEM_3_DESC ||
        DEFAULT_TEXTS.ITEM_3_DESC,
      ITEM_3_ACTION:
        translated?.CONNECTION_ITEM_3_ACTION || DEFAULT_TEXTS.ITEM_3_ACTION,
      ITEM_4_TITLE:
        translated?.CONNECTION_ITEM_4_TITLE || DEFAULT_TEXTS.ITEM_4_TITLE,
      ITEM_4_DESC:
        translated?.CONNECTION_ITEM_4_DESC ||
        DEFAULT_TEXTS.ITEM_4_DESC,
      ITEM_4_ACTION:
        translated?.CONNECTION_ITEM_4_ACTION || DEFAULT_TEXTS.ITEM_4_ACTION,
      ITEM_5_TITLE:
        translated?.CONNECTION_ITEM_5_TITLE || DEFAULT_TEXTS.ITEM_5_TITLE,
      ITEM_5_DESC:
        translated?.CONNECTION_ITEM_5_DESC ||
        DEFAULT_TEXTS.ITEM_5_DESC,
      ITEM_5_ACTION:
        translated?.CONNECTION_ITEM_5_ACTION || DEFAULT_TEXTS.ITEM_5_ACTION,
      ITEM_6_TITLE:
        translated?.CONNECTION_ITEM_6_TITLE || DEFAULT_TEXTS.ITEM_6_TITLE,
      ITEM_6_DESC:
        translated?.CONNECTION_ITEM_6_DESC ||
        DEFAULT_TEXTS.ITEM_6_DESC,
      ITEM_6_ACTION:
        translated?.CONNECTION_ITEM_6_ACTION || DEFAULT_TEXTS.ITEM_6_ACTION,
    }),
    [translated]
  );
  const navigation = useNavigation();
  const recordCompletedOnce = useMemo(() => createInterventionCompletedRecorder(), []);
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle } = useTheme();
  const techniqueScreenStyles = useTechniqueScreenStyles();
  const [completedExercises, setCompletedExercises] = useState([]);
  const CONNECTION_EXERCISES = useMemo(
    () => [
      { id: 1, title: TEXTS.ITEM_1_TITLE, description: TEXTS.ITEM_1_DESC, action: TEXTS.ITEM_1_ACTION, icon: 'phone' },
      { id: 2, title: TEXTS.ITEM_2_TITLE, description: TEXTS.ITEM_2_DESC, action: TEXTS.ITEM_2_ACTION, icon: 'email' },
      { id: 3, title: TEXTS.ITEM_3_TITLE, description: TEXTS.ITEM_3_DESC, action: TEXTS.ITEM_3_ACTION, icon: 'calendar' },
      { id: 4, title: TEXTS.ITEM_4_TITLE, description: TEXTS.ITEM_4_DESC, action: TEXTS.ITEM_4_ACTION, icon: 'share-variant' },
      { id: 5, title: TEXTS.ITEM_5_TITLE, description: TEXTS.ITEM_5_DESC, action: TEXTS.ITEM_5_ACTION, icon: 'hand-heart' },
      { id: 6, title: TEXTS.ITEM_6_TITLE, description: TEXTS.ITEM_6_DESC, action: TEXTS.ITEM_6_ACTION, icon: 'heart' },
    ],
    [
      TEXTS.ITEM_1_TITLE,
      TEXTS.ITEM_1_DESC,
      TEXTS.ITEM_1_ACTION,
      TEXTS.ITEM_2_TITLE,
      TEXTS.ITEM_2_DESC,
      TEXTS.ITEM_2_ACTION,
      TEXTS.ITEM_3_TITLE,
      TEXTS.ITEM_3_DESC,
      TEXTS.ITEM_3_ACTION,
      TEXTS.ITEM_4_TITLE,
      TEXTS.ITEM_4_DESC,
      TEXTS.ITEM_4_ACTION,
      TEXTS.ITEM_5_TITLE,
      TEXTS.ITEM_5_DESC,
      TEXTS.ITEM_5_ACTION,
      TEXTS.ITEM_6_TITLE,
      TEXTS.ITEM_6_DESC,
      TEXTS.ITEM_6_ACTION,
    ]
  );

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
      }),
    [colors],
  );

  const handleCompleteExercise = (exerciseId) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (!completedExercises.includes(exerciseId)) {
      recordCompletedOnce('connection_exercise');
      setCompletedExercises(prev => [...prev, exerciseId]);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <ParticleBackground />
      <Header
        title={TEXTS.TITLE}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={techniqueScreenStyles.scrollContent}>
        <View style={techniqueScreenStyles.introPanel}>
          <Text style={techniqueScreenStyles.introKicker}>{TEXTS.INTRO_KICKER}</Text>
          <Text style={techniqueScreenStyles.introTitle}>{TEXTS.INTRO_TITLE}</Text>
          <Text style={techniqueScreenStyles.introText}>{TEXTS.INTRO_BODY}</Text>
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
                  {isCompleted ? TEXTS.COMPLETED : exercise.action}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

// `styles` se deriva del tema dentro del componente.

export default ConnectionExerciseScreen;
