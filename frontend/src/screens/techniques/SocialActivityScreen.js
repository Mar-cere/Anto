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
import { useSectionTranslations } from '../../hooks/useTranslations';
import { createInterventionCompletedRecorder } from '../../utils/recordInterventionCompleted';
import { useTechniqueScreenStyles } from './techniqueScreenStyles';

const DEFAULT_TEXTS = {
  TITLE: 'Actividades Sociales',
  INTRO_KICKER: 'Conexion',
  INTRO_TITLE: 'Actividades para hacer juntos',
  INTRO_BODY:
    'Las actividades sociales pueden mejorar tu bienestar y fortalecer tus relaciones. Aqui tienes algunas ideas.',
  ITEM_1_TITLE: 'Cafe con un amigo',
  ITEM_1_DESC:
    'Tomate un cafe o te con un amigo. Las conversaciones casuales pueden ser muy reconfortantes.',
  ITEM_1_CATEGORY: 'Relajado',
  ITEM_2_TITLE: 'Caminar juntos',
  ITEM_2_DESC:
    'Sal a caminar con alguien. El ejercicio y la compania son una gran combinacion.',
  ITEM_2_CATEGORY: 'Activo',
  ITEM_3_TITLE: 'Cocinar juntos',
  ITEM_3_DESC:
    'Prepara una comida con amigos o familia. Cocinar juntos puede ser divertido y relajante.',
  ITEM_3_CATEGORY: 'Creativo',
  ITEM_4_TITLE: 'Jugar juegos',
  ITEM_4_DESC:
    'Juega juegos de mesa o videojuegos con otros. El juego puede ser una gran forma de conexion.',
  ITEM_4_CATEGORY: 'Divertido',
  ITEM_5_TITLE: 'Ver una pelicula',
  ITEM_5_DESC:
    'Ve una pelicula o serie con alguien. Compartir una experiencia puede crear conexion.',
  ITEM_5_CATEGORY: 'Relajado',
  ITEM_6_TITLE: 'Hacer ejercicio',
  ITEM_6_DESC:
    'Haz ejercicio con un companero. El apoyo mutuo puede hacer el ejercicio mas motivador.',
  ITEM_6_CATEGORY: 'Activo',
  ITEM_7_TITLE: 'Voluntariado',
  ITEM_7_DESC:
    'Haz voluntariado con otros. Ayudar a otros juntos puede crear conexiones significativas.',
  ITEM_7_CATEGORY: 'Significativo',
  ITEM_8_TITLE: 'Grupo de apoyo',
  ITEM_8_DESC:
    'Unete a un grupo de apoyo o club. Conectar con personas con intereses similares puede ser muy valioso.',
  ITEM_8_CATEGORY: 'Apoyo',
};

const SocialActivityScreen = () => {
  const translated = useSectionTranslations('TECHNIQUES');
  const TEXTS = useMemo(
    () => ({
      TITLE: translated?.SOCIAL_TITLE || DEFAULT_TEXTS.TITLE,
      INTRO_KICKER:
        translated?.SOCIAL_INTRO_KICKER || DEFAULT_TEXTS.INTRO_KICKER,
      INTRO_TITLE:
        translated?.SOCIAL_INTRO_TITLE || DEFAULT_TEXTS.INTRO_TITLE,
      INTRO_BODY:
        translated?.SOCIAL_INTRO_BODY ||
        DEFAULT_TEXTS.INTRO_BODY,
      ITEM_1_TITLE:
        translated?.SOCIAL_ITEM_1_TITLE || DEFAULT_TEXTS.ITEM_1_TITLE,
      ITEM_1_DESC:
        translated?.SOCIAL_ITEM_1_DESC ||
        DEFAULT_TEXTS.ITEM_1_DESC,
      ITEM_1_CATEGORY:
        translated?.SOCIAL_ITEM_1_CATEGORY || DEFAULT_TEXTS.ITEM_1_CATEGORY,
      ITEM_2_TITLE:
        translated?.SOCIAL_ITEM_2_TITLE || DEFAULT_TEXTS.ITEM_2_TITLE,
      ITEM_2_DESC:
        translated?.SOCIAL_ITEM_2_DESC ||
        DEFAULT_TEXTS.ITEM_2_DESC,
      ITEM_2_CATEGORY:
        translated?.SOCIAL_ITEM_2_CATEGORY || DEFAULT_TEXTS.ITEM_2_CATEGORY,
      ITEM_3_TITLE:
        translated?.SOCIAL_ITEM_3_TITLE || DEFAULT_TEXTS.ITEM_3_TITLE,
      ITEM_3_DESC:
        translated?.SOCIAL_ITEM_3_DESC ||
        DEFAULT_TEXTS.ITEM_3_DESC,
      ITEM_3_CATEGORY:
        translated?.SOCIAL_ITEM_3_CATEGORY || DEFAULT_TEXTS.ITEM_3_CATEGORY,
      ITEM_4_TITLE:
        translated?.SOCIAL_ITEM_4_TITLE || DEFAULT_TEXTS.ITEM_4_TITLE,
      ITEM_4_DESC:
        translated?.SOCIAL_ITEM_4_DESC ||
        DEFAULT_TEXTS.ITEM_4_DESC,
      ITEM_4_CATEGORY:
        translated?.SOCIAL_ITEM_4_CATEGORY || DEFAULT_TEXTS.ITEM_4_CATEGORY,
      ITEM_5_TITLE:
        translated?.SOCIAL_ITEM_5_TITLE || DEFAULT_TEXTS.ITEM_5_TITLE,
      ITEM_5_DESC:
        translated?.SOCIAL_ITEM_5_DESC ||
        DEFAULT_TEXTS.ITEM_5_DESC,
      ITEM_5_CATEGORY:
        translated?.SOCIAL_ITEM_5_CATEGORY || DEFAULT_TEXTS.ITEM_5_CATEGORY,
      ITEM_6_TITLE:
        translated?.SOCIAL_ITEM_6_TITLE || DEFAULT_TEXTS.ITEM_6_TITLE,
      ITEM_6_DESC:
        translated?.SOCIAL_ITEM_6_DESC ||
        DEFAULT_TEXTS.ITEM_6_DESC,
      ITEM_6_CATEGORY:
        translated?.SOCIAL_ITEM_6_CATEGORY || DEFAULT_TEXTS.ITEM_6_CATEGORY,
      ITEM_7_TITLE:
        translated?.SOCIAL_ITEM_7_TITLE || DEFAULT_TEXTS.ITEM_7_TITLE,
      ITEM_7_DESC:
        translated?.SOCIAL_ITEM_7_DESC ||
        DEFAULT_TEXTS.ITEM_7_DESC,
      ITEM_7_CATEGORY:
        translated?.SOCIAL_ITEM_7_CATEGORY || DEFAULT_TEXTS.ITEM_7_CATEGORY,
      ITEM_8_TITLE:
        translated?.SOCIAL_ITEM_8_TITLE || DEFAULT_TEXTS.ITEM_8_TITLE,
      ITEM_8_DESC:
        translated?.SOCIAL_ITEM_8_DESC ||
        DEFAULT_TEXTS.ITEM_8_DESC,
      ITEM_8_CATEGORY:
        translated?.SOCIAL_ITEM_8_CATEGORY || DEFAULT_TEXTS.ITEM_8_CATEGORY,
    }),
    [translated]
  );
  const navigation = useNavigation();
  const recordCompletedOnce = useMemo(() => createInterventionCompletedRecorder(), []);
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle } = useTheme();
  const techniqueScreenStyles = useTechniqueScreenStyles();
  const SOCIAL_ACTIVITIES = useMemo(
    () => [
      { id: 1, title: TEXTS.ITEM_1_TITLE, description: TEXTS.ITEM_1_DESC, icon: 'coffee', category: TEXTS.ITEM_1_CATEGORY },
      { id: 2, title: TEXTS.ITEM_2_TITLE, description: TEXTS.ITEM_2_DESC, icon: 'walk', category: TEXTS.ITEM_2_CATEGORY },
      { id: 3, title: TEXTS.ITEM_3_TITLE, description: TEXTS.ITEM_3_DESC, icon: 'chef-hat', category: TEXTS.ITEM_3_CATEGORY },
      { id: 4, title: TEXTS.ITEM_4_TITLE, description: TEXTS.ITEM_4_DESC, icon: 'gamepad-variant', category: TEXTS.ITEM_4_CATEGORY },
      { id: 5, title: TEXTS.ITEM_5_TITLE, description: TEXTS.ITEM_5_DESC, icon: 'movie', category: TEXTS.ITEM_5_CATEGORY },
      { id: 6, title: TEXTS.ITEM_6_TITLE, description: TEXTS.ITEM_6_DESC, icon: 'dumbbell', category: TEXTS.ITEM_6_CATEGORY },
      { id: 7, title: TEXTS.ITEM_7_TITLE, description: TEXTS.ITEM_7_DESC, icon: 'hand-heart', category: TEXTS.ITEM_7_CATEGORY },
      { id: 8, title: TEXTS.ITEM_8_TITLE, description: TEXTS.ITEM_8_DESC, icon: 'account-group', category: TEXTS.ITEM_8_CATEGORY },
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

  const handleSelectActivity = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    recordCompletedOnce('social_activity');
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
