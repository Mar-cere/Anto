/**
 * Pantalla de Tomar un Descanso
 * Sugerencias para tomar descansos efectivos
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useState } from 'react';
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
import { recordInterventionCompleted } from '../../utils/recordInterventionCompleted';
import { useTechniqueScreenStyles } from './techniqueScreenStyles';

const DEFAULT_TEXTS = {
  TITLE: 'Tomar un Descanso',
  INTRO_KICKER: 'Pausa',
  INTRO_TITLE: 'Tomate un descanso',
  INTRO_BODY:
    'Los descansos regulares son importantes para mantener la productividad y el bienestar.',
  TIMER_REMAINING: 'Tiempo restante',
  FINISH: 'Finalizar descanso',
  START: 'Comenzar',
  ACTIVITY_1_TITLE: 'Estiramientos',
  ACTIVITY_1_DESC:
    'Haz algunos estiramientos suaves para liberar tension muscular.',
  ACTIVITY_1_DURATION: '5 minutos',
  ACTIVITY_2_TITLE: 'Caminar',
  ACTIVITY_2_DESC:
    'Sal a caminar por unos minutos. El movimiento puede refrescar tu mente.',
  ACTIVITY_2_DURATION: '10 minutos',
  ACTIVITY_3_TITLE: 'Respiracion',
  ACTIVITY_3_DESC:
    'Toma 10 respiraciones profundas para relajarte y recargar energia.',
  ACTIVITY_3_DURATION: '2 minutos',
  ACTIVITY_4_TITLE: 'Beber agua',
  ACTIVITY_4_DESC:
    'Hidratate. A veces la fatiga es simplemente deshidratacion.',
  ACTIVITY_4_DURATION: '1 minuto',
  ACTIVITY_5_TITLE: 'Mirar por la ventana',
  ACTIVITY_5_DESC:
    'Tomate un momento para observar el mundo exterior y descansar tus ojos.',
  ACTIVITY_5_DURATION: '3 minutos',
};

const TaskBreakScreen = () => {
  const translated = useSectionTranslations('TECHNIQUES');
  const TEXTS = useMemo(
    () => ({
      TITLE: translated?.BREAK_TITLE || DEFAULT_TEXTS.TITLE,
      INTRO_KICKER: translated?.BREAK_INTRO_KICKER || DEFAULT_TEXTS.INTRO_KICKER,
      INTRO_TITLE: translated?.BREAK_INTRO_TITLE || DEFAULT_TEXTS.INTRO_TITLE,
      INTRO_BODY:
        translated?.BREAK_INTRO_BODY ||
        DEFAULT_TEXTS.INTRO_BODY,
      TIMER_REMAINING:
        translated?.BREAK_TIMER_REMAINING || DEFAULT_TEXTS.TIMER_REMAINING,
      FINISH: translated?.BREAK_FINISH || DEFAULT_TEXTS.FINISH,
      START: translated?.BREAK_START || DEFAULT_TEXTS.START,
      ACTIVITY_1_TITLE:
        translated?.BREAK_ACTIVITY_1_TITLE || DEFAULT_TEXTS.ACTIVITY_1_TITLE,
      ACTIVITY_1_DESC:
        translated?.BREAK_ACTIVITY_1_DESC ||
        DEFAULT_TEXTS.ACTIVITY_1_DESC,
      ACTIVITY_1_DURATION:
        translated?.BREAK_ACTIVITY_1_DURATION || DEFAULT_TEXTS.ACTIVITY_1_DURATION,
      ACTIVITY_2_TITLE:
        translated?.BREAK_ACTIVITY_2_TITLE || DEFAULT_TEXTS.ACTIVITY_2_TITLE,
      ACTIVITY_2_DESC:
        translated?.BREAK_ACTIVITY_2_DESC ||
        DEFAULT_TEXTS.ACTIVITY_2_DESC,
      ACTIVITY_2_DURATION:
        translated?.BREAK_ACTIVITY_2_DURATION || DEFAULT_TEXTS.ACTIVITY_2_DURATION,
      ACTIVITY_3_TITLE:
        translated?.BREAK_ACTIVITY_3_TITLE || DEFAULT_TEXTS.ACTIVITY_3_TITLE,
      ACTIVITY_3_DESC:
        translated?.BREAK_ACTIVITY_3_DESC ||
        DEFAULT_TEXTS.ACTIVITY_3_DESC,
      ACTIVITY_3_DURATION:
        translated?.BREAK_ACTIVITY_3_DURATION || DEFAULT_TEXTS.ACTIVITY_3_DURATION,
      ACTIVITY_4_TITLE:
        translated?.BREAK_ACTIVITY_4_TITLE || DEFAULT_TEXTS.ACTIVITY_4_TITLE,
      ACTIVITY_4_DESC:
        translated?.BREAK_ACTIVITY_4_DESC ||
        DEFAULT_TEXTS.ACTIVITY_4_DESC,
      ACTIVITY_4_DURATION:
        translated?.BREAK_ACTIVITY_4_DURATION || DEFAULT_TEXTS.ACTIVITY_4_DURATION,
      ACTIVITY_5_TITLE:
        translated?.BREAK_ACTIVITY_5_TITLE || DEFAULT_TEXTS.ACTIVITY_5_TITLE,
      ACTIVITY_5_DESC:
        translated?.BREAK_ACTIVITY_5_DESC ||
        DEFAULT_TEXTS.ACTIVITY_5_DESC,
      ACTIVITY_5_DURATION:
        translated?.BREAK_ACTIVITY_5_DURATION || DEFAULT_TEXTS.ACTIVITY_5_DURATION,
    }),
    [translated]
  );
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle } = useTheme();
  const techniqueScreenStyles = useTechniqueScreenStyles();
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const BREAK_ACTIVITIES = useMemo(
    () => [
      { id: 1, title: TEXTS.ACTIVITY_1_TITLE, description: TEXTS.ACTIVITY_1_DESC, duration: TEXTS.ACTIVITY_1_DURATION, icon: 'yoga' },
      { id: 2, title: TEXTS.ACTIVITY_2_TITLE, description: TEXTS.ACTIVITY_2_DESC, duration: TEXTS.ACTIVITY_2_DURATION, icon: 'walk' },
      { id: 3, title: TEXTS.ACTIVITY_3_TITLE, description: TEXTS.ACTIVITY_3_DESC, duration: TEXTS.ACTIVITY_3_DURATION, icon: 'breathing' },
      { id: 4, title: TEXTS.ACTIVITY_4_TITLE, description: TEXTS.ACTIVITY_4_DESC, duration: TEXTS.ACTIVITY_4_DURATION, icon: 'cup-water' },
      { id: 5, title: TEXTS.ACTIVITY_5_TITLE, description: TEXTS.ACTIVITY_5_DESC, duration: TEXTS.ACTIVITY_5_DURATION, icon: 'window-open' },
    ],
    [
      TEXTS.ACTIVITY_1_TITLE,
      TEXTS.ACTIVITY_1_DESC,
      TEXTS.ACTIVITY_1_DURATION,
      TEXTS.ACTIVITY_2_TITLE,
      TEXTS.ACTIVITY_2_DESC,
      TEXTS.ACTIVITY_2_DURATION,
      TEXTS.ACTIVITY_3_TITLE,
      TEXTS.ACTIVITY_3_DESC,
      TEXTS.ACTIVITY_3_DURATION,
      TEXTS.ACTIVITY_4_TITLE,
      TEXTS.ACTIVITY_4_DESC,
      TEXTS.ACTIVITY_4_DURATION,
      TEXTS.ACTIVITY_5_TITLE,
      TEXTS.ACTIVITY_5_DESC,
      TEXTS.ACTIVITY_5_DURATION,
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
        activeWrap: {
          alignItems: 'center',
          borderColor: colors.primary,
          borderWidth: StyleSheet.hairlineWidth,
        },
        timerBlock: {
          alignItems: 'center',
          marginBottom: 24,
          alignSelf: 'stretch',
        },
        activeIconBlock: {
          alignItems: 'center',
          marginBottom: 8,
          alignSelf: 'stretch',
        },
        activeDescription: {
          textAlign: 'center',
        },
      }),
    [colors],
  );

  useEffect(() => {
    let interval = null;
    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => time - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isActive) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      recordInterventionCompleted('task_break');
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeRemaining]);

  const handleStartBreak = (activity) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedActivity(activity);
    const minutes = parseInt(activity.duration, 10);
    setTimeRemaining(minutes * 60);
    setIsActive(true);
  };

  const handleStop = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    recordInterventionCompleted('task_break');
    setIsActive(false);
    setTimeRemaining(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

        {isActive && selectedActivity ? (
          <View style={[techniqueScreenStyles.card, styles.activeWrap]}>
            <View style={styles.timerBlock}>
              <Text style={techniqueScreenStyles.timerText}>{formatTime(timeRemaining)}</Text>
              <Text style={techniqueScreenStyles.timerLabel}>{TEXTS.TIMER_REMAINING}</Text>
            </View>
            <View style={styles.activeIconBlock}>
              <MaterialCommunityIcons
                name={selectedActivity.icon}
                size={56}
                color={colors.primary}
              />
              <Text style={techniqueScreenStyles.cardTitle}>{selectedActivity.title}</Text>
              <Text style={[techniqueScreenStyles.cardBody, styles.activeDescription]}>
                {selectedActivity.description}
              </Text>
            </View>
            <TouchableOpacity style={techniqueScreenStyles.stopButton} onPress={handleStop}>
              <Text style={techniqueScreenStyles.stopButtonText}>{TEXTS.FINISH}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          BREAK_ACTIVITIES.map(activity => (
            <TouchableOpacity
              key={activity.id}
              style={techniqueScreenStyles.card}
              onPress={() => handleStartBreak(activity)}
            >
              <View style={techniqueScreenStyles.rowHeader}>
                <View style={techniqueScreenStyles.iconTile}>
                  <MaterialCommunityIcons
                    name={activity.icon}
                    size={28}
                    color={colors.primary}
                  />
                </View>
                <View style={techniqueScreenStyles.infoColumn}>
                  <Text style={techniqueScreenStyles.cardTitle}>{activity.title}</Text>
                  <Text style={techniqueScreenStyles.cardMeta}>{activity.duration}</Text>
                </View>
              </View>
              <Text style={techniqueScreenStyles.cardBody}>{activity.description}</Text>
              <View style={techniqueScreenStyles.primaryButton}>
                <Text style={techniqueScreenStyles.primaryButtonText}>{TEXTS.START}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
// `styles` se deriva del tema dentro del componente.

export default TaskBreakScreen;
