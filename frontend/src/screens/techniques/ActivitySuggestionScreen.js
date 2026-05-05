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
import ParticleBackground from '../../components/ParticleBackground';
import { colors } from '../../styles/globalStyles';
import { techniqueScreenStyles } from './techniqueScreenStyles';

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
      <ParticleBackground />
      <Header
        title="Actividades Sugeridas"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={techniqueScreenStyles.scrollContent}>
        <View style={techniqueScreenStyles.introPanel}>
          <Text style={techniqueScreenStyles.introKicker}>Actividades</Text>
          <Text style={techniqueScreenStyles.introTitle}>Elige una actividad</Text>
          <Text style={techniqueScreenStyles.introText}>
            Estas actividades pueden ayudarte a mejorar tu estado de ánimo y bienestar.
          </Text>
        </View>

        {ACTIVITIES.map(activity => (
          <TouchableOpacity
            key={activity.id}
            style={[
              techniqueScreenStyles.card,
              selectedActivity?.id === activity.id && techniqueScreenStyles.cardSelected,
            ]}
            onPress={() => handleSelectActivity(activity)}
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
            {selectedActivity?.id === activity.id && (
              <View style={techniqueScreenStyles.selectedRow}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={22}
                  color={colors.success}
                />
                <Text style={techniqueScreenStyles.selectedRowText}>Actividad seleccionada</Text>
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
});

export default ActivitySuggestionScreen;
