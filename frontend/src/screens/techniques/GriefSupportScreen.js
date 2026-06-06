/**
 * Pantalla de Apoyo en Duelo
 * Recursos y ejercicios para procesar el duelo
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
import { recordInterventionCompleted } from '../../utils/recordInterventionCompleted';
import { useTechniqueScreenStyles } from './techniqueScreenStyles';

const DEFAULT_TEXTS = {
  TITLE: 'Apoyo en Duelo',
  INTRO_KICKER: 'Duelo',
  INTRO_TITLE: 'Apoyo en el proceso',
  INTRO_BODY:
    'El duelo es unico para cada persona. No hay una forma correcta de sentirlo. Tomate el tiempo que necesites.',
  RESOURCE_1_TITLE: 'Permitete sentir',
  RESOURCE_1_DESC:
    'El duelo es un proceso natural. Permitete sentir todas las emociones que surgen, sin juzgarlas.',
  RESOURCE_2_TITLE: 'Habla sobre tus sentimientos',
  RESOURCE_2_DESC:
    'Compartir tus sentimientos con alguien de confianza puede ser muy sanador.',
  RESOURCE_3_TITLE: 'Crea rituales de recuerdo',
  RESOURCE_3_DESC:
    'Crea rituales que te ayuden a honrar la memoria de quien perdiste.',
  RESOURCE_4_TITLE: 'Busca apoyo profesional',
  RESOURCE_4_DESC:
    'No dudes en buscar ayuda profesional si sientes que el duelo te esta abrumando.',
  PRACTICE_TITLE: 'Ejercicio: escribe un recuerdo',
  PRACTICE_HINT:
    'Escribir sobre los recuerdos que tienes puede ayudarte a procesar el duelo.',
  INPUT_PLACEHOLDER: 'Escribe un recuerdo especial que quieras preservar...',
  SAVE_MEMORY: 'Guardar recuerdo',
};

const GriefSupportScreen = () => {
  const translated = useSectionTranslations('TECHNIQUES');
  const TEXTS = useMemo(
    () => ({
      TITLE: translated?.GRIEF_TITLE || DEFAULT_TEXTS.TITLE,
      INTRO_KICKER: translated?.GRIEF_INTRO_KICKER || DEFAULT_TEXTS.INTRO_KICKER,
      INTRO_TITLE: translated?.GRIEF_INTRO_TITLE || DEFAULT_TEXTS.INTRO_TITLE,
      INTRO_BODY:
        translated?.GRIEF_INTRO_BODY ||
        DEFAULT_TEXTS.INTRO_BODY,
      RESOURCE_1_TITLE:
        translated?.GRIEF_RESOURCE_1_TITLE || DEFAULT_TEXTS.RESOURCE_1_TITLE,
      RESOURCE_1_DESC:
        translated?.GRIEF_RESOURCE_1_DESC ||
        DEFAULT_TEXTS.RESOURCE_1_DESC,
      RESOURCE_2_TITLE:
        translated?.GRIEF_RESOURCE_2_TITLE || DEFAULT_TEXTS.RESOURCE_2_TITLE,
      RESOURCE_2_DESC:
        translated?.GRIEF_RESOURCE_2_DESC ||
        DEFAULT_TEXTS.RESOURCE_2_DESC,
      RESOURCE_3_TITLE:
        translated?.GRIEF_RESOURCE_3_TITLE || DEFAULT_TEXTS.RESOURCE_3_TITLE,
      RESOURCE_3_DESC:
        translated?.GRIEF_RESOURCE_3_DESC ||
        DEFAULT_TEXTS.RESOURCE_3_DESC,
      RESOURCE_4_TITLE:
        translated?.GRIEF_RESOURCE_4_TITLE || DEFAULT_TEXTS.RESOURCE_4_TITLE,
      RESOURCE_4_DESC:
        translated?.GRIEF_RESOURCE_4_DESC ||
        DEFAULT_TEXTS.RESOURCE_4_DESC,
      PRACTICE_TITLE:
        translated?.GRIEF_PRACTICE_TITLE || DEFAULT_TEXTS.PRACTICE_TITLE,
      PRACTICE_HINT:
        translated?.GRIEF_PRACTICE_HINT ||
        DEFAULT_TEXTS.PRACTICE_HINT,
      INPUT_PLACEHOLDER:
        translated?.GRIEF_INPUT_PLACEHOLDER ||
        DEFAULT_TEXTS.INPUT_PLACEHOLDER,
      SAVE_MEMORY: translated?.GRIEF_SAVE_MEMORY || DEFAULT_TEXTS.SAVE_MEMORY,
    }),
    [translated]
  );
  const GRIEF_RESOURCES = useMemo(
    () => [
      {
        id: 1,
        title: TEXTS.RESOURCE_1_TITLE,
        description: TEXTS.RESOURCE_1_DESC,
        icon: 'heart',
      },
      {
        id: 2,
        title: TEXTS.RESOURCE_2_TITLE,
        description: TEXTS.RESOURCE_2_DESC,
        icon: 'account-group',
      },
      {
        id: 3,
        title: TEXTS.RESOURCE_3_TITLE,
        description: TEXTS.RESOURCE_3_DESC,
        icon: 'candle',
      },
      {
        id: 4,
        title: TEXTS.RESOURCE_4_TITLE,
        description: TEXTS.RESOURCE_4_DESC,
        icon: 'medical-bag',
      },
    ],
    [
      TEXTS.RESOURCE_1_TITLE,
      TEXTS.RESOURCE_1_DESC,
      TEXTS.RESOURCE_2_TITLE,
      TEXTS.RESOURCE_2_DESC,
      TEXTS.RESOURCE_3_TITLE,
      TEXTS.RESOURCE_3_DESC,
      TEXTS.RESOURCE_4_TITLE,
      TEXTS.RESOURCE_4_DESC,
    ]
  );
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle } = useTheme();
  const techniqueScreenStyles = useTechniqueScreenStyles();
  const [memoryText, setMemoryText] = useState('');

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

  const handleSaveMemory = () => {
    if (memoryText.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      recordInterventionCompleted('grief_support');
      setMemoryText('');
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

          {GRIEF_RESOURCES.map(resource => (
            <View key={resource.id} style={techniqueScreenStyles.card}>
              <View style={techniqueScreenStyles.rowHeader}>
                <View style={techniqueScreenStyles.iconTile}>
                  <MaterialCommunityIcons
                    name={resource.icon}
                    size={28}
                    color={colors.primary}
                  />
                </View>
                <View style={techniqueScreenStyles.infoColumn}>
                  <Text style={techniqueScreenStyles.cardTitle}>{resource.title}</Text>
                </View>
              </View>
              <Text style={techniqueScreenStyles.cardBody}>{resource.description}</Text>
            </View>
          ))}

          <View style={techniqueScreenStyles.formBlock}>
            <Text style={techniqueScreenStyles.formSectionHeading}>{TEXTS.PRACTICE_TITLE}</Text>
            <Text style={techniqueScreenStyles.formHint}>{TEXTS.PRACTICE_HINT}</Text>
            <TextInput
              style={[techniqueScreenStyles.textInput, techniqueScreenStyles.textInputTall]}
              placeholder={TEXTS.INPUT_PLACEHOLDER}
              placeholderTextColor={colors.textSecondary}
              value={memoryText}
              onChangeText={setMemoryText}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[
                techniqueScreenStyles.saveButton,
                !memoryText.trim() && techniqueScreenStyles.saveButtonDisabled,
              ]}
              onPress={handleSaveMemory}
              disabled={!memoryText.trim()}
            >
              <Text style={techniqueScreenStyles.saveButtonText}>{TEXTS.SAVE_MEMORY}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
// `styles` se deriva del tema dentro del componente.

export default GriefSupportScreen;
