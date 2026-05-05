/**
 * Pantalla de Tomar un Descanso
 * Sugerencias para tomar descansos efectivos
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useState, useEffect } from 'react';
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

const BREAK_ACTIVITIES = [
  {
    id: 1,
    title: 'Estiramientos',
    description: 'Haz algunos estiramientos suaves para liberar tensión muscular.',
    duration: '5 minutos',
    icon: 'yoga',
  },
  {
    id: 2,
    title: 'Caminar',
    description: 'Sal a caminar por unos minutos. El movimiento puede refrescar tu mente.',
    duration: '10 minutos',
    icon: 'walk',
  },
  {
    id: 3,
    title: 'Respiración',
    description: 'Toma 10 respiraciones profundas para relajarte y recargar energía.',
    duration: '2 minutos',
    icon: 'breathing',
  },
  {
    id: 4,
    title: 'Beber agua',
    description: 'Hidrátate. A veces la fatiga es simplemente deshidratación.',
    duration: '1 minuto',
    icon: 'cup-water',
  },
  {
    id: 5,
    title: 'Mirar por la ventana',
    description: 'Tómate un momento para observar el mundo exterior y descansar tus ojos.',
    duration: '3 minutos',
    icon: 'window-open',
  },
];

const TaskBreakScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    let interval = null;
    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => time - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isActive) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
      <StatusBar barStyle="light-content" />
      <ParticleBackground />
      <Header
        title="Tomar un Descanso"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={techniqueScreenStyles.scrollContent}>
        <View style={techniqueScreenStyles.introPanel}>
          <Text style={techniqueScreenStyles.introKicker}>Pausa</Text>
          <Text style={techniqueScreenStyles.introTitle}>Tómate un descanso</Text>
          <Text style={techniqueScreenStyles.introText}>
            Los descansos regulares son importantes para mantener la productividad y el bienestar.
          </Text>
        </View>

        {isActive && selectedActivity ? (
          <View style={[techniqueScreenStyles.card, styles.activeWrap]}>
            <View style={styles.timerBlock}>
              <Text style={techniqueScreenStyles.timerText}>{formatTime(timeRemaining)}</Text>
              <Text style={techniqueScreenStyles.timerLabel}>Tiempo restante</Text>
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
              <Text style={techniqueScreenStyles.stopButtonText}>Finalizar descanso</Text>
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
                <Text style={techniqueScreenStyles.primaryButtonText}>Comenzar</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
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
});

export default TaskBreakScreen;
