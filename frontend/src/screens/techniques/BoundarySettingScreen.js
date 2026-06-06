/**
 * Pantalla de Establecer Límites
 * Guía para establecer límites saludables
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import ParticleBackground from '../../components/ParticleBackground';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { useTechniqueScreenStyles } from './techniqueScreenStyles';
import { recordInterventionCompleted } from '../../utils/recordInterventionCompleted';

const DEFAULT_TEXTS = {
  TITLE: 'Establecer Limites',
  INTRO_KICKER: 'Limites',
  INTRO_TITLE: 'Establece limites saludables',
  INTRO_BODY:
    'Los limites son importantes para tu bienestar. Te ayudan a proteger tu tiempo, energia y salud mental.',
  GUIDE_1_TITLE: 'Identifica tus limites',
  GUIDE_1_DESC:
    'Piensa en situaciones donde te sientes incomodo o sobrecargado. Estos son indicadores de que necesitas establecer limites.',
  GUIDE_2_TITLE: 'Comunica claramente',
  GUIDE_2_DESC:
    'Se claro y directo al comunicar tus limites. Usa frases como "No puedo hacer eso" o "Necesito que respetes mi tiempo".',
  GUIDE_3_TITLE: 'Manten tu posicion',
  GUIDE_3_DESC:
    'Es normal que otros prueben tus limites. Manten tu posicion con amabilidad pero firmeza.',
  GUIDE_4_TITLE: 'Practica el autocuidado',
  GUIDE_4_DESC:
    'Establecer limites es una forma de autocuidado. No te sientas culpable por priorizar tu bienestar.',
  PRACTICE_TITLE: 'Practica: escribe un limite que quieras establecer',
  INPUT_PLACEHOLDER:
    'Ejemplo: No respondere mensajes de trabajo despues de las 8 PM',
  SAVE: 'Guardar',
};

const BoundarySettingScreen = () => {
  const translated = useSectionTranslations('TECHNIQUES');
  const TEXTS = useMemo(
    () => ({
      TITLE: translated?.BOUNDARY_TITLE || DEFAULT_TEXTS.TITLE,
      INTRO_KICKER: translated?.BOUNDARY_INTRO_KICKER || DEFAULT_TEXTS.INTRO_KICKER,
      INTRO_TITLE: translated?.BOUNDARY_INTRO_TITLE || DEFAULT_TEXTS.INTRO_TITLE,
      INTRO_BODY:
        translated?.BOUNDARY_INTRO_BODY ||
        DEFAULT_TEXTS.INTRO_BODY,
      GUIDE_1_TITLE:
        translated?.BOUNDARY_GUIDE_1_TITLE || DEFAULT_TEXTS.GUIDE_1_TITLE,
      GUIDE_1_DESC: translated?.BOUNDARY_GUIDE_1_DESC || DEFAULT_TEXTS.GUIDE_1_DESC,
      GUIDE_2_TITLE:
        translated?.BOUNDARY_GUIDE_2_TITLE || DEFAULT_TEXTS.GUIDE_2_TITLE,
      GUIDE_2_DESC: translated?.BOUNDARY_GUIDE_2_DESC || DEFAULT_TEXTS.GUIDE_2_DESC,
      GUIDE_3_TITLE:
        translated?.BOUNDARY_GUIDE_3_TITLE || DEFAULT_TEXTS.GUIDE_3_TITLE,
      GUIDE_3_DESC: translated?.BOUNDARY_GUIDE_3_DESC || DEFAULT_TEXTS.GUIDE_3_DESC,
      GUIDE_4_TITLE:
        translated?.BOUNDARY_GUIDE_4_TITLE || DEFAULT_TEXTS.GUIDE_4_TITLE,
      GUIDE_4_DESC: translated?.BOUNDARY_GUIDE_4_DESC || DEFAULT_TEXTS.GUIDE_4_DESC,
      PRACTICE_TITLE:
        translated?.BOUNDARY_PRACTICE_TITLE ||
        DEFAULT_TEXTS.PRACTICE_TITLE,
      INPUT_PLACEHOLDER:
        translated?.BOUNDARY_INPUT_PLACEHOLDER ||
        DEFAULT_TEXTS.INPUT_PLACEHOLDER,
      SAVE: translated?.BOUNDARY_SAVE || DEFAULT_TEXTS.SAVE,
    }),
    [translated]
  );
  const BOUNDARY_GUIDES = useMemo(
    () => [
      {
        id: 1,
        title: TEXTS.GUIDE_1_TITLE,
        description: TEXTS.GUIDE_1_DESC,
        icon: 'lightbulb-on',
      },
      {
        id: 2,
        title: TEXTS.GUIDE_2_TITLE,
        description: TEXTS.GUIDE_2_DESC,
        icon: 'message-text',
      },
      {
        id: 3,
        title: TEXTS.GUIDE_3_TITLE,
        description: TEXTS.GUIDE_3_DESC,
        icon: 'shield-check',
      },
      {
        id: 4,
        title: TEXTS.GUIDE_4_TITLE,
        description: TEXTS.GUIDE_4_DESC,
        icon: 'heart',
      },
    ],
    [
      TEXTS.GUIDE_1_TITLE,
      TEXTS.GUIDE_1_DESC,
      TEXTS.GUIDE_2_TITLE,
      TEXTS.GUIDE_2_DESC,
      TEXTS.GUIDE_3_TITLE,
      TEXTS.GUIDE_3_DESC,
      TEXTS.GUIDE_4_TITLE,
      TEXTS.GUIDE_4_DESC,
    ]
  );
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle } = useTheme();
  const techniqueScreenStyles = useTechniqueScreenStyles();
  const [boundaryText, setBoundaryText] = useState('');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        keyboardView: {
          flex: 1,
        },
        scrollView: {
          flex: 1,
        },
      }),
    [colors],
  );

  const handleSave = () => {
    if (boundaryText.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      recordInterventionCompleted('boundary_setting');
      setBoundaryText('');
    }
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={techniqueScreenStyles.scrollContent}>
          <View style={techniqueScreenStyles.introPanel}>
            <Text style={techniqueScreenStyles.introKicker}>{TEXTS.INTRO_KICKER}</Text>
            <Text style={techniqueScreenStyles.introTitle}>{TEXTS.INTRO_TITLE}</Text>
            <Text style={techniqueScreenStyles.introText}>{TEXTS.INTRO_BODY}</Text>
          </View>

          {BOUNDARY_GUIDES.map(guide => (
            <View key={guide.id} style={techniqueScreenStyles.card}>
              <View style={techniqueScreenStyles.rowHeader}>
                <View style={techniqueScreenStyles.iconTile}>
                  <MaterialCommunityIcons
                    name={guide.icon}
                    size={28}
                    color={colors.primary}
                  />
                </View>
                <View style={techniqueScreenStyles.infoColumn}>
                  <Text style={techniqueScreenStyles.cardTitle}>{guide.title}</Text>
                </View>
              </View>
              <Text style={techniqueScreenStyles.cardBody}>{guide.description}</Text>
            </View>
          ))}

          <View style={techniqueScreenStyles.formBlock}>
            <Text style={techniqueScreenStyles.formSectionHeading}>
              {TEXTS.PRACTICE_TITLE}
            </Text>
            <TextInput
              style={techniqueScreenStyles.textInput}
              placeholder={TEXTS.INPUT_PLACEHOLDER}
              placeholderTextColor={colors.textSecondary}
              value={boundaryText}
              onChangeText={setBoundaryText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[
                techniqueScreenStyles.saveButton,
                !boundaryText.trim() && techniqueScreenStyles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={!boundaryText.trim()}
            >
              <Text style={techniqueScreenStyles.saveButtonText}>{TEXTS.SAVE}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default BoundarySettingScreen;
