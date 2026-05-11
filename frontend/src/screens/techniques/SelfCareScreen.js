/**
 * Pantalla de Autocuidado
 * Sugerencias y guías para el autocuidado
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
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
import { useTechniqueScreenStyles } from './techniqueScreenStyles';

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
  const { colors, statusBarStyle } = useTheme();
  const techniqueScreenStyles = useTechniqueScreenStyles();

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

  const handleSelectActivity = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <ParticleBackground />
      <Header
        title="Autocuidado"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={techniqueScreenStyles.scrollContent}>
        <View style={techniqueScreenStyles.introPanel}>
          <Text style={techniqueScreenStyles.introKicker}>Autocuidado</Text>
          <Text style={techniqueScreenStyles.introTitle}>Cuídate a ti mismo</Text>
          <Text style={techniqueScreenStyles.introText}>
            El autocuidado no es egoísta, es necesario. Aquí tienes algunas ideas para cuidar de ti mismo.
          </Text>
        </View>

        {SELF_CARE_ACTIVITIES.map(activity => (
          <TouchableOpacity
            key={activity.id}
            style={techniqueScreenStyles.card}
            onPress={handleSelectActivity}
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
                <Text style={techniqueScreenStyles.cardCategory}>{activity.category}</Text>
              </View>
            </View>
            <Text style={techniqueScreenStyles.cardBody}>{activity.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};
// `styles` se deriva del tema dentro del componente.

export default SelfCareScreen;
