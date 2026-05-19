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
import { useSectionTranslations } from '../../hooks/useTranslations';
import { useTechniqueScreenStyles } from './techniqueScreenStyles';

const DEFAULT_TEXTS = {
  TITLE: 'Autocuidado',
  INTRO_KICKER: 'Autocuidado',
  INTRO_TITLE: 'Cuidate a ti mismo',
  INTRO_BODY:
    'El autocuidado no es egoista, es necesario. Aqui tienes algunas ideas para cuidar de ti mismo.',
  ITEM_1_TITLE: 'Bano Relajante',
  ITEM_1_DESC:
    'Tomate un bano caliente con sales o aceites esenciales. El agua caliente puede ayudar a relajar los musculos y la mente.',
  ITEM_1_CATEGORY: 'Fisico',
  ITEM_2_TITLE: 'Masaje',
  ITEM_2_DESC:
    'Date un masaje suave en las manos, pies o cuello. Puede ayudar a liberar tension.',
  ITEM_2_CATEGORY: 'Fisico',
  ITEM_3_TITLE: 'Tiempo a Solas',
  ITEM_3_DESC:
    'Reserva tiempo para ti mismo. Puede ser leer, meditar, o simplemente estar en silencio.',
  ITEM_3_CATEGORY: 'Mental',
  ITEM_4_TITLE: 'Alimentacion Consciente',
  ITEM_4_DESC:
    'Prepara una comida nutritiva y disfrutala sin distracciones. La alimentacion consciente es una forma de autocuidado.',
  ITEM_4_CATEGORY: 'Fisico',
  ITEM_5_TITLE: 'Dormir Bien',
  ITEM_5_DESC:
    'Asegurate de tener un buen descanso. El sueno es fundamental para tu bienestar.',
  ITEM_5_CATEGORY: 'Fisico',
  ITEM_6_TITLE: 'Desconexion Digital',
  ITEM_6_DESC:
    'Tomate un descanso de las pantallas. Puede ayudar a reducir el estres y la ansiedad.',
  ITEM_6_CATEGORY: 'Mental',
};

const SelfCareScreen = () => {
  const translated = useSectionTranslations('TECHNIQUES');
  const TEXTS = useMemo(
    () => ({
      TITLE: translated?.SELF_CARE_TITLE || DEFAULT_TEXTS.TITLE,
      INTRO_KICKER:
        translated?.SELF_CARE_INTRO_KICKER || DEFAULT_TEXTS.INTRO_KICKER,
      INTRO_TITLE:
        translated?.SELF_CARE_INTRO_TITLE || DEFAULT_TEXTS.INTRO_TITLE,
      INTRO_BODY:
        translated?.SELF_CARE_INTRO_BODY ||
        DEFAULT_TEXTS.INTRO_BODY,
      ITEM_1_TITLE:
        translated?.SELF_CARE_ITEM_1_TITLE || DEFAULT_TEXTS.ITEM_1_TITLE,
      ITEM_1_DESC:
        translated?.SELF_CARE_ITEM_1_DESC ||
        DEFAULT_TEXTS.ITEM_1_DESC,
      ITEM_1_CATEGORY:
        translated?.SELF_CARE_ITEM_1_CATEGORY || DEFAULT_TEXTS.ITEM_1_CATEGORY,
      ITEM_2_TITLE:
        translated?.SELF_CARE_ITEM_2_TITLE || DEFAULT_TEXTS.ITEM_2_TITLE,
      ITEM_2_DESC:
        translated?.SELF_CARE_ITEM_2_DESC ||
        DEFAULT_TEXTS.ITEM_2_DESC,
      ITEM_2_CATEGORY:
        translated?.SELF_CARE_ITEM_2_CATEGORY || DEFAULT_TEXTS.ITEM_2_CATEGORY,
      ITEM_3_TITLE:
        translated?.SELF_CARE_ITEM_3_TITLE || DEFAULT_TEXTS.ITEM_3_TITLE,
      ITEM_3_DESC:
        translated?.SELF_CARE_ITEM_3_DESC ||
        DEFAULT_TEXTS.ITEM_3_DESC,
      ITEM_3_CATEGORY:
        translated?.SELF_CARE_ITEM_3_CATEGORY || DEFAULT_TEXTS.ITEM_3_CATEGORY,
      ITEM_4_TITLE:
        translated?.SELF_CARE_ITEM_4_TITLE || DEFAULT_TEXTS.ITEM_4_TITLE,
      ITEM_4_DESC:
        translated?.SELF_CARE_ITEM_4_DESC ||
        DEFAULT_TEXTS.ITEM_4_DESC,
      ITEM_4_CATEGORY:
        translated?.SELF_CARE_ITEM_4_CATEGORY || DEFAULT_TEXTS.ITEM_4_CATEGORY,
      ITEM_5_TITLE:
        translated?.SELF_CARE_ITEM_5_TITLE || DEFAULT_TEXTS.ITEM_5_TITLE,
      ITEM_5_DESC:
        translated?.SELF_CARE_ITEM_5_DESC ||
        DEFAULT_TEXTS.ITEM_5_DESC,
      ITEM_5_CATEGORY:
        translated?.SELF_CARE_ITEM_5_CATEGORY || DEFAULT_TEXTS.ITEM_5_CATEGORY,
      ITEM_6_TITLE:
        translated?.SELF_CARE_ITEM_6_TITLE || DEFAULT_TEXTS.ITEM_6_TITLE,
      ITEM_6_DESC:
        translated?.SELF_CARE_ITEM_6_DESC ||
        DEFAULT_TEXTS.ITEM_6_DESC,
      ITEM_6_CATEGORY:
        translated?.SELF_CARE_ITEM_6_CATEGORY || DEFAULT_TEXTS.ITEM_6_CATEGORY,
    }),
    [translated]
  );
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle } = useTheme();
  const techniqueScreenStyles = useTechniqueScreenStyles();
  const SELF_CARE_ACTIVITIES = useMemo(
    () => [
      { id: 1, title: TEXTS.ITEM_1_TITLE, description: TEXTS.ITEM_1_DESC, icon: 'bathtub', category: TEXTS.ITEM_1_CATEGORY },
      { id: 2, title: TEXTS.ITEM_2_TITLE, description: TEXTS.ITEM_2_DESC, icon: 'hand-back-right', category: TEXTS.ITEM_2_CATEGORY },
      { id: 3, title: TEXTS.ITEM_3_TITLE, description: TEXTS.ITEM_3_DESC, icon: 'account-circle', category: TEXTS.ITEM_3_CATEGORY },
      { id: 4, title: TEXTS.ITEM_4_TITLE, description: TEXTS.ITEM_4_DESC, icon: 'food', category: TEXTS.ITEM_4_CATEGORY },
      { id: 5, title: TEXTS.ITEM_5_TITLE, description: TEXTS.ITEM_5_DESC, icon: 'sleep', category: TEXTS.ITEM_5_CATEGORY },
      { id: 6, title: TEXTS.ITEM_6_TITLE, description: TEXTS.ITEM_6_DESC, icon: 'phone-off', category: TEXTS.ITEM_6_CATEGORY },
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
