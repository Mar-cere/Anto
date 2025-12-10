/**
 * Pantalla de Actividades Sociales
 * Sugerencias de actividades para hacer con otras personas
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

  const handleSelectActivity = (activity) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Aquí podrías agregar lógica para planificar la actividad
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <Header
        title="Actividades Sociales"
        onBack={() => navigation.goBack()}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>👥 Actividades para hacer juntos</Text>
          <Text style={styles.introText}>
            Las actividades sociales pueden mejorar tu bienestar y fortalecer tus relaciones.
            Aquí tienes algunas ideas.
          </Text>
        </View>

        {SOCIAL_ACTIVITIES.map(activity => (
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

export default SocialActivityScreen;

