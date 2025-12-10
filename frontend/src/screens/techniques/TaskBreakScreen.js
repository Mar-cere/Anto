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
import { colors } from '../../styles/globalStyles';

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
    const minutes = parseInt(activity.duration);
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
      <Header
        title="Tomar un Descanso"
        onBack={() => navigation.goBack()}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>☕ Tómate un descanso</Text>
          <Text style={styles.introText}>
            Los descansos regulares son importantes para mantener la productividad y el bienestar.
          </Text>
        </View>

        {isActive && selectedActivity ? (
          <View style={styles.activeContainer}>
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
              <Text style={styles.timerLabel}>Tiempo restante</Text>
            </View>
            <View style={styles.activityInfo}>
              <MaterialCommunityIcons
                name={selectedActivity.icon}
                size={64}
                color={colors.primary}
              />
              <Text style={styles.activityTitle}>{selectedActivity.title}</Text>
              <Text style={styles.activityDescription}>{selectedActivity.description}</Text>
            </View>
            <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
              <Text style={styles.stopButtonText}>Finalizar Descanso</Text>
            </TouchableOpacity>
          </View>
        ) : (
          BREAK_ACTIVITIES.map(activity => (
            <TouchableOpacity
              key={activity.id}
              style={styles.activityCard}
              onPress={() => handleStartBreak(activity)}
            >
              <View style={styles.activityHeader}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name={activity.icon}
                    size={32}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityDuration}>{activity.duration}</Text>
                </View>
              </View>
              <Text style={styles.activityDescription}>{activity.description}</Text>
              <TouchableOpacity style={styles.startButton}>
                <Text style={styles.startButtonText}>Comenzar</Text>
              </TouchableOpacity>
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
  activityCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activityHeader: {
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
  activityInfo: {
    flex: 1,
    alignItems: 'center',
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  activityDuration: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  activityDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 15,
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  timerLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  stopButton: {
    backgroundColor: colors.error,
    borderRadius: 8,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  stopButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TaskBreakScreen;

