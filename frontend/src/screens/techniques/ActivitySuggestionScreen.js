/**
 * Pantalla de Actividades Sugeridas
 * Muestra actividades sugeridas basadas en el estado emocional del usuario
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

const ACTIVITIES = [
  {
    id: 1,
    title: 'Caminata al aire libre',
    description: 'Sal a caminar por 15-20 minutos. El movimiento y el aire fresco pueden mejorar tu estado de ánimo.',
    icon: 'walk',
    category: 'Físico',
  },
  {
    id: 2,
    title: 'Escuchar música',
    description: 'Pon tu música favorita y déjate llevar. La música puede ser muy terapéutica.',
    icon: 'music',
    category: 'Relajación',
  },
  {
    id: 3,
    title: 'Leer un libro',
    description: 'Sumérgete en una buena historia. La lectura puede ser una excelente forma de distracción positiva.',
    icon: 'book-open-variant',
    category: 'Mental',
  },
  {
    id: 4,
    title: 'Dibujar o colorear',
    description: 'Expresa tus emociones a través del arte. No necesitas ser un artista, solo disfruta el proceso.',
    icon: 'palette',
    category: 'Creativo',
  },
  {
    id: 5,
    title: 'Cocinar algo nuevo',
    description: 'Prueba una receta nueva. Cocinar puede ser relajante y gratificante.',
    icon: 'chef-hat',
    category: 'Creativo',
  },
  {
    id: 6,
    title: 'Llamar a un amigo',
    description: 'Conecta con alguien que te importa. Las conexiones sociales son importantes para el bienestar.',
    icon: 'phone',
    category: 'Social',
  },
  {
    id: 7,
    title: 'Ejercicio ligero',
    description: 'Haz estiramientos o yoga suave. El movimiento puede liberar endorfinas.',
    icon: 'yoga',
    category: 'Físico',
  },
  {
    id: 8,
    title: 'Escribir en un diario',
    description: 'Expresa tus pensamientos y sentimientos por escrito. Puede ser muy liberador.',
    icon: 'notebook',
    category: 'Mental',
  },
];

const ActivitySuggestionScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [selectedActivity, setSelectedActivity] = useState(null);

  const handleSelectActivity = (activity) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedActivity(activity);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <Header
        title="Actividades Sugeridas"
        onBack={() => navigation.goBack()}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>🎯 Elige una actividad</Text>
          <Text style={styles.introText}>
            Estas actividades pueden ayudarte a mejorar tu estado de ánimo y bienestar.
          </Text>
        </View>

        {ACTIVITIES.map(activity => (
          <TouchableOpacity
            key={activity.id}
            style={[
              styles.activityCard,
              selectedActivity?.id === activity.id && styles.activityCardSelected
            ]}
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
            {selectedActivity?.id === activity.id && (
              <View style={styles.selectedIndicator}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={24}
                  color={colors.success}
                />
                <Text style={styles.selectedText}>Actividad seleccionada</Text>
              </View>
            )}
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
  activityCardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
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
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  selectedText: {
    fontSize: 14,
    color: colors.success,
    marginLeft: 8,
    fontWeight: '600',
  },
});

export default ActivitySuggestionScreen;

