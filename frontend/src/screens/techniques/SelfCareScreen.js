/**
 * Pantalla de Autocuidado
 * Sugerencias y guías para el autocuidado
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React from 'react';
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

const SELF_CARE_ACTIVITIES = [
  {
    id: 1,
    title: 'Baño Relajante',
    description: 'Tómate un baño caliente con sales o aceites esenciales. El agua caliente puede ayudar a relajar los músculos y la mente.',
    icon: 'bathtub',
    category: 'Físico',
  },
  {
    id: 2,
    title: 'Masaje',
    description: 'Date un masaje suave en las manos, pies o cuello. Puede ayudar a liberar tensión.',
    icon: 'hand-back-right',
    category: 'Físico',
  },
  {
    id: 3,
    title: 'Tiempo a Solas',
    description: 'Reserva tiempo para ti mismo. Puede ser leer, meditar, o simplemente estar en silencio.',
    icon: 'account-circle',
    category: 'Mental',
  },
  {
    id: 4,
    title: 'Alimentación Consciente',
    description: 'Prepara una comida nutritiva y disfrútala sin distracciones. La alimentación consciente es una forma de autocuidado.',
    icon: 'food',
    category: 'Físico',
  },
  {
    id: 5,
    title: 'Dormir Bien',
    description: 'Asegúrate de tener un buen descanso. El sueño es fundamental para tu bienestar.',
    icon: 'sleep',
    category: 'Físico',
  },
  {
    id: 6,
    title: 'Desconexión Digital',
    description: 'Tómate un descanso de las pantallas. Puede ayudar a reducir el estrés y la ansiedad.',
    icon: 'phone-off',
    category: 'Mental',
  },
];

const SelfCareScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleSelectActivity = (activity) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Aquí podrías agregar lógica para marcar como completada o guardar en historial
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <Header
        title="Autocuidado"
        onBack={() => navigation.goBack()}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>💆 Cuídate a ti mismo</Text>
          <Text style={styles.introText}>
            El autocuidado no es egoísta, es necesario. Aquí tienes algunas ideas para cuidar de ti mismo.
          </Text>
        </View>

        {SELF_CARE_ACTIVITIES.map(activity => (
          <TouchableOpacity
            key={activity.id}
            style={styles.activityCard}
            onPress={() => handleSelectActivity(activity)}
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
                <Text style={styles.activityCategory}>{activity.category}</Text>
              </View>
            </View>
            <Text style={styles.activityDescription}>{activity.description}</Text>
          </TouchableOpacity>
        ))}
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
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  activityCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  activityDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default SelfCareScreen;

