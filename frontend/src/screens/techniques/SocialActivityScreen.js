/**
 * Pantalla de Actividades Sociales
 * Sugerencias de actividades para hacer con otras personas
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

const SOCIAL_ACTIVITIES = [
  {
    id: 1,
    title: 'Café con un amigo',
    description: 'Tómate un café o té con un amigo. Las conversaciones casuales pueden ser muy reconfortantes.',
    icon: 'coffee',
    category: 'Relajado',
  },
  {
    id: 2,
    title: 'Caminar juntos',
    description: 'Sal a caminar con alguien. El ejercicio y la compañía son una gran combinación.',
    icon: 'walk',
    category: 'Activo',
  },
  {
    id: 3,
    title: 'Cocinar juntos',
    description: 'Prepara una comida con amigos o familia. Cocinar juntos puede ser divertido y relajante.',
    icon: 'chef-hat',
    category: 'Creativo',
  },
  {
    id: 4,
    title: 'Jugar juegos',
    description: 'Juega juegos de mesa o videojuegos con otros. El juego puede ser una gran forma de conexión.',
    icon: 'gamepad-variant',
    category: 'Divertido',
  },
  {
    id: 5,
    title: 'Ver una película',
    description: 'Ve una película o serie con alguien. Compartir una experiencia puede crear conexión.',
    icon: 'movie',
    category: 'Relajado',
  },
  {
    id: 6,
    title: 'Hacer ejercicio',
    description: 'Haz ejercicio con un compañero. El apoyo mutuo puede hacer el ejercicio más motivador.',
    icon: 'dumbbell',
    category: 'Activo',
  },
  {
    id: 7,
    title: 'Voluntariado',
    description: 'Haz voluntariado con otros. Ayudar a otros juntos puede crear conexiones significativas.',
    icon: 'hand-heart',
    category: 'Significativo',
  },
  {
    id: 8,
    title: 'Grupo de apoyo',
    description: 'Únete a un grupo de apoyo o club. Conectar con personas con intereses similares puede ser muy valioso.',
    icon: 'account-group',
    category: 'Apoyo',
  },
];

const SocialActivityScreen = () => {
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
        title="Actividades Sociales"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={techniqueScreenStyles.scrollContent}>
        <View style={techniqueScreenStyles.introPanel}>
          <Text style={techniqueScreenStyles.introKicker}>Conexión</Text>
          <Text style={techniqueScreenStyles.introTitle}>Actividades para hacer juntos</Text>
          <Text style={techniqueScreenStyles.introText}>
            Las actividades sociales pueden mejorar tu bienestar y fortalecer tus relaciones.
            Aquí tienes algunas ideas.
          </Text>
        </View>

        {SOCIAL_ACTIVITIES.map(activity => (
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

export default SocialActivityScreen;
