/**
 * Pantalla de Actividades Sugeridas
 * Muestra actividades sugeridas basadas en el estado emocional del usuario
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
import { useTechniqueScreenStyles } from './techniqueScreenStyles';

const DEFAULT_TEXTS = {
  TITLE: 'Actividades Sugeridas',
  INTRO_KICKER: 'Actividades',
  INTRO_TITLE: 'Elige una actividad',
  INTRO_BODY:
    'Estas actividades pueden ayudarte a mejorar tu estado de animo y bienestar.',
  SELECTED: 'Actividad seleccionada',
  ITEM_1_TITLE: 'Caminata al aire libre',
  ITEM_1_DESC:
    'Sal a caminar por 15-20 minutos. El movimiento y el aire fresco pueden mejorar tu estado de animo.',
  ITEM_1_CATEGORY: 'Fisico',
  ITEM_2_TITLE: 'Escuchar musica',
  ITEM_2_DESC:
    'Pon tu musica favorita y dejate llevar. La musica puede ser muy terapeutica.',
  ITEM_2_CATEGORY: 'Relajacion',
  ITEM_3_TITLE: 'Leer un libro',
  ITEM_3_DESC:
    'Sumergete en una buena historia. La lectura puede ser una excelente forma de distraccion positiva.',
  ITEM_3_CATEGORY: 'Mental',
  ITEM_4_TITLE: 'Dibujar o colorear',
  ITEM_4_DESC:
    'Expresa tus emociones a traves del arte. No necesitas ser un artista, solo disfruta el proceso.',
  ITEM_4_CATEGORY: 'Creativo',
  ITEM_5_TITLE: 'Cocinar algo nuevo',
  ITEM_5_DESC:
    'Prueba una receta nueva. Cocinar puede ser relajante y gratificante.',
  ITEM_5_CATEGORY: 'Creativo',
  ITEM_6_TITLE: 'Llamar a un amigo',
  ITEM_6_DESC:
    'Conecta con alguien que te importa. Las conexiones sociales son importantes para el bienestar.',
  ITEM_6_CATEGORY: 'Social',
  ITEM_7_TITLE: 'Ejercicio ligero',
  ITEM_7_DESC:
    'Haz estiramientos o yoga suave. El movimiento puede liberar endorfinas.',
  ITEM_7_CATEGORY: 'Fisico',
  ITEM_8_TITLE: 'Escribir en un diario',
  ITEM_8_DESC:
    'Expresa tus pensamientos y sentimientos por escrito. Puede ser muy liberador.',
  ITEM_8_CATEGORY: 'Mental',
};

const ActivitySuggestionScreen = () => {
  const translated = useSectionTranslations('TECHNIQUES');
  const TEXTS = useMemo(
    () => ({
      TITLE: translated?.ACTIVITY_SUGGESTION_TITLE || DEFAULT_TEXTS.TITLE,
      INTRO_KICKER:
        translated?.ACTIVITY_SUGGESTION_INTRO_KICKER || DEFAULT_TEXTS.INTRO_KICKER,
      INTRO_TITLE:
        translated?.ACTIVITY_SUGGESTION_INTRO_TITLE || DEFAULT_TEXTS.INTRO_TITLE,
      INTRO_BODY:
        translated?.ACTIVITY_SUGGESTION_INTRO_BODY || DEFAULT_TEXTS.INTRO_BODY,
      SELECTED:
        translated?.ACTIVITY_SUGGESTION_SELECTED || DEFAULT_TEXTS.SELECTED,
      ITEM_1_TITLE:
        translated?.ACTIVITY_SUGGESTION_ITEM_1_TITLE || DEFAULT_TEXTS.ITEM_1_TITLE,
      ITEM_1_DESC:
        translated?.ACTIVITY_SUGGESTION_ITEM_1_DESC || DEFAULT_TEXTS.ITEM_1_DESC,
      ITEM_1_CATEGORY:
        translated?.ACTIVITY_SUGGESTION_ITEM_1_CATEGORY ||
        DEFAULT_TEXTS.ITEM_1_CATEGORY,
      ITEM_2_TITLE:
        translated?.ACTIVITY_SUGGESTION_ITEM_2_TITLE || DEFAULT_TEXTS.ITEM_2_TITLE,
      ITEM_2_DESC:
        translated?.ACTIVITY_SUGGESTION_ITEM_2_DESC || DEFAULT_TEXTS.ITEM_2_DESC,
      ITEM_2_CATEGORY:
        translated?.ACTIVITY_SUGGESTION_ITEM_2_CATEGORY ||
        DEFAULT_TEXTS.ITEM_2_CATEGORY,
      ITEM_3_TITLE:
        translated?.ACTIVITY_SUGGESTION_ITEM_3_TITLE || DEFAULT_TEXTS.ITEM_3_TITLE,
      ITEM_3_DESC:
        translated?.ACTIVITY_SUGGESTION_ITEM_3_DESC || DEFAULT_TEXTS.ITEM_3_DESC,
      ITEM_3_CATEGORY:
        translated?.ACTIVITY_SUGGESTION_ITEM_3_CATEGORY ||
        DEFAULT_TEXTS.ITEM_3_CATEGORY,
      ITEM_4_TITLE:
        translated?.ACTIVITY_SUGGESTION_ITEM_4_TITLE || DEFAULT_TEXTS.ITEM_4_TITLE,
      ITEM_4_DESC:
        translated?.ACTIVITY_SUGGESTION_ITEM_4_DESC || DEFAULT_TEXTS.ITEM_4_DESC,
      ITEM_4_CATEGORY:
        translated?.ACTIVITY_SUGGESTION_ITEM_4_CATEGORY ||
        DEFAULT_TEXTS.ITEM_4_CATEGORY,
      ITEM_5_TITLE:
        translated?.ACTIVITY_SUGGESTION_ITEM_5_TITLE || DEFAULT_TEXTS.ITEM_5_TITLE,
      ITEM_5_DESC:
        translated?.ACTIVITY_SUGGESTION_ITEM_5_DESC || DEFAULT_TEXTS.ITEM_5_DESC,
      ITEM_5_CATEGORY:
        translated?.ACTIVITY_SUGGESTION_ITEM_5_CATEGORY ||
        DEFAULT_TEXTS.ITEM_5_CATEGORY,
      ITEM_6_TITLE:
        translated?.ACTIVITY_SUGGESTION_ITEM_6_TITLE || DEFAULT_TEXTS.ITEM_6_TITLE,
      ITEM_6_DESC:
        translated?.ACTIVITY_SUGGESTION_ITEM_6_DESC || DEFAULT_TEXTS.ITEM_6_DESC,
      ITEM_6_CATEGORY:
        translated?.ACTIVITY_SUGGESTION_ITEM_6_CATEGORY ||
        DEFAULT_TEXTS.ITEM_6_CATEGORY,
      ITEM_7_TITLE:
        translated?.ACTIVITY_SUGGESTION_ITEM_7_TITLE || DEFAULT_TEXTS.ITEM_7_TITLE,
      ITEM_7_DESC:
        translated?.ACTIVITY_SUGGESTION_ITEM_7_DESC || DEFAULT_TEXTS.ITEM_7_DESC,
      ITEM_7_CATEGORY:
        translated?.ACTIVITY_SUGGESTION_ITEM_7_CATEGORY ||
        DEFAULT_TEXTS.ITEM_7_CATEGORY,
      ITEM_8_TITLE:
        translated?.ACTIVITY_SUGGESTION_ITEM_8_TITLE || DEFAULT_TEXTS.ITEM_8_TITLE,
      ITEM_8_DESC:
        translated?.ACTIVITY_SUGGESTION_ITEM_8_DESC || DEFAULT_TEXTS.ITEM_8_DESC,
      ITEM_8_CATEGORY:
        translated?.ACTIVITY_SUGGESTION_ITEM_8_CATEGORY ||
        DEFAULT_TEXTS.ITEM_8_CATEGORY,
    }),
    [translated]
  );
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle } = useTheme();
  const techniqueScreenStyles = useTechniqueScreenStyles();
  const [selectedActivity, setSelectedActivity] = useState(null);
  const ACTIVITIES = useMemo(
    () => [
      { id: 1, title: TEXTS.ITEM_1_TITLE, description: TEXTS.ITEM_1_DESC, icon: 'walk', category: TEXTS.ITEM_1_CATEGORY },
      { id: 2, title: TEXTS.ITEM_2_TITLE, description: TEXTS.ITEM_2_DESC, icon: 'music', category: TEXTS.ITEM_2_CATEGORY },
      { id: 3, title: TEXTS.ITEM_3_TITLE, description: TEXTS.ITEM_3_DESC, icon: 'book-open-variant', category: TEXTS.ITEM_3_CATEGORY },
      { id: 4, title: TEXTS.ITEM_4_TITLE, description: TEXTS.ITEM_4_DESC, icon: 'palette', category: TEXTS.ITEM_4_CATEGORY },
      { id: 5, title: TEXTS.ITEM_5_TITLE, description: TEXTS.ITEM_5_DESC, icon: 'chef-hat', category: TEXTS.ITEM_5_CATEGORY },
      { id: 6, title: TEXTS.ITEM_6_TITLE, description: TEXTS.ITEM_6_DESC, icon: 'phone', category: TEXTS.ITEM_6_CATEGORY },
      { id: 7, title: TEXTS.ITEM_7_TITLE, description: TEXTS.ITEM_7_DESC, icon: 'yoga', category: TEXTS.ITEM_7_CATEGORY },
      { id: 8, title: TEXTS.ITEM_8_TITLE, description: TEXTS.ITEM_8_DESC, icon: 'notebook', category: TEXTS.ITEM_8_CATEGORY },
    ],
    [
      TEXTS.ITEM_1_TITLE,
      TEXTS.ITEM_1_DESC,
      TEXTS.ITEM_1_CATEGORY,
      TEXTS.ITEM_2_TITLE,
      TEXTS.ITEM_2_DESC,
      TEXTS.ITEM_2_CATEGORY,
      TEXTS.ITEM_3_TITLE,
      TEXTS.ITEM_3_DESC,
      TEXTS.ITEM_3_CATEGORY,
      TEXTS.ITEM_4_TITLE,
      TEXTS.ITEM_4_DESC,
      TEXTS.ITEM_4_CATEGORY,
      TEXTS.ITEM_5_TITLE,
      TEXTS.ITEM_5_DESC,
      TEXTS.ITEM_5_CATEGORY,
      TEXTS.ITEM_6_TITLE,
      TEXTS.ITEM_6_DESC,
      TEXTS.ITEM_6_CATEGORY,
      TEXTS.ITEM_7_TITLE,
      TEXTS.ITEM_7_DESC,
      TEXTS.ITEM_7_CATEGORY,
      TEXTS.ITEM_8_TITLE,
      TEXTS.ITEM_8_DESC,
      TEXTS.ITEM_8_CATEGORY,
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

  const handleSelectActivity = (activity) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedActivity(activity);
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
                <Text style={techniqueScreenStyles.selectedRowText}>{TEXTS.SELECTED}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

// `styles` se deriva del tema dentro del componente.

export default ActivitySuggestionScreen;
