/**
 * Pantalla de Herramienta de Comunicación
 * Guía interactiva para mejorar la comunicación
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

const DEFAULT_TEXTS = {
  TITLE: 'Herramienta de Comunicacion',
  INTRO_KICKER: 'Comunicacion',
  INTRO_TITLE: 'Herramientas empaticas',
  INTRO_BODY:
    'Estas tecnicas te ayudaran a comunicarte de manera mas efectiva y empatica.',
  BACK: 'Volver',
  TECH_1_TITLE: 'Mensajes "Yo"',
  TECH_1_DESC:
    'Expresa tus sentimientos usando "Yo siento..." en lugar de "Tu haces..."',
  TECH_1_EXAMPLE:
    'Ejemplo: "Yo me siento herido cuando..." en lugar de "Tu siempre haces..."',
  TECH_2_TITLE: 'Escucha Activa',
  TECH_2_DESC:
    'Practica escuchar sin interrumpir y reflejar lo que escuchas.',
  TECH_2_EXAMPLE:
    'Ejemplo: "Entiendo que te sientes... ¿Es correcto?"',
  TECH_3_TITLE: 'Validacion',
  TECH_3_DESC:
    'Reconoce y valida los sentimientos de la otra persona.',
  TECH_3_EXAMPLE: 'Ejemplo: "Tiene sentido que te sientas asi..."',
  TECH_4_TITLE: 'Preguntas Abiertas',
  TECH_4_DESC:
    'Haz preguntas que inviten a la reflexion y el dialogo.',
  TECH_4_EXAMPLE: 'Ejemplo: "¿Como te gustaria que fuera diferente?"',
  PRACTICE_PROMPT: 'Practica escribiendo un mensaje usando esta tecnica:',
  INPUT_PLACEHOLDER: 'Escribe tu mensaje aqui...',
  SAVE_PRACTICE: 'Guardar practica',
};

const CommunicationToolScreen = () => {
  const translated = useSectionTranslations('TECHNIQUES');
  const TEXTS = useMemo(
    () => ({
      TITLE: translated?.COMMUNICATION_TITLE || DEFAULT_TEXTS.TITLE,
      INTRO_KICKER:
        translated?.COMMUNICATION_INTRO_KICKER || DEFAULT_TEXTS.INTRO_KICKER,
      INTRO_TITLE:
        translated?.COMMUNICATION_INTRO_TITLE || DEFAULT_TEXTS.INTRO_TITLE,
      INTRO_BODY:
        translated?.COMMUNICATION_INTRO_BODY ||
        DEFAULT_TEXTS.INTRO_BODY,
      BACK: translated?.COMMUNICATION_BACK || DEFAULT_TEXTS.BACK,
      TECH_1_TITLE:
        translated?.COMMUNICATION_TECH_1_TITLE || DEFAULT_TEXTS.TECH_1_TITLE,
      TECH_1_DESC:
        translated?.COMMUNICATION_TECH_1_DESC ||
        DEFAULT_TEXTS.TECH_1_DESC,
      TECH_1_EXAMPLE:
        translated?.COMMUNICATION_TECH_1_EXAMPLE ||
        DEFAULT_TEXTS.TECH_1_EXAMPLE,
      TECH_2_TITLE:
        translated?.COMMUNICATION_TECH_2_TITLE || DEFAULT_TEXTS.TECH_2_TITLE,
      TECH_2_DESC:
        translated?.COMMUNICATION_TECH_2_DESC ||
        DEFAULT_TEXTS.TECH_2_DESC,
      TECH_2_EXAMPLE:
        translated?.COMMUNICATION_TECH_2_EXAMPLE ||
        DEFAULT_TEXTS.TECH_2_EXAMPLE,
      TECH_3_TITLE:
        translated?.COMMUNICATION_TECH_3_TITLE || DEFAULT_TEXTS.TECH_3_TITLE,
      TECH_3_DESC:
        translated?.COMMUNICATION_TECH_3_DESC ||
        DEFAULT_TEXTS.TECH_3_DESC,
      TECH_3_EXAMPLE:
        translated?.COMMUNICATION_TECH_3_EXAMPLE ||
        DEFAULT_TEXTS.TECH_3_EXAMPLE,
      TECH_4_TITLE:
        translated?.COMMUNICATION_TECH_4_TITLE || DEFAULT_TEXTS.TECH_4_TITLE,
      TECH_4_DESC:
        translated?.COMMUNICATION_TECH_4_DESC ||
        DEFAULT_TEXTS.TECH_4_DESC,
      TECH_4_EXAMPLE:
        translated?.COMMUNICATION_TECH_4_EXAMPLE ||
        DEFAULT_TEXTS.TECH_4_EXAMPLE,
      PRACTICE_PROMPT:
        translated?.COMMUNICATION_PRACTICE_PROMPT ||
        DEFAULT_TEXTS.PRACTICE_PROMPT,
      INPUT_PLACEHOLDER:
        translated?.COMMUNICATION_INPUT_PLACEHOLDER ||
        DEFAULT_TEXTS.INPUT_PLACEHOLDER,
      SAVE_PRACTICE:
        translated?.COMMUNICATION_SAVE_PRACTICE || DEFAULT_TEXTS.SAVE_PRACTICE,
    }),
    [translated]
  );
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle } = useTheme();
  const techniqueScreenStyles = useTechniqueScreenStyles();
  const [selectedTechnique, setSelectedTechnique] = useState(null);
  const [practiceText, setPracticeText] = useState('');
  const TECHNIQUES = useMemo(
    () => [
      {
        id: 1,
        title: TEXTS.TECH_1_TITLE,
        description: TEXTS.TECH_1_DESC,
        example: TEXTS.TECH_1_EXAMPLE,
        icon: 'account',
      },
      {
        id: 2,
        title: TEXTS.TECH_2_TITLE,
        description: TEXTS.TECH_2_DESC,
        example: TEXTS.TECH_2_EXAMPLE,
        icon: 'ear-hearing',
      },
      {
        id: 3,
        title: TEXTS.TECH_3_TITLE,
        description: TEXTS.TECH_3_DESC,
        example: TEXTS.TECH_3_EXAMPLE,
        icon: 'check-circle',
      },
      {
        id: 4,
        title: TEXTS.TECH_4_TITLE,
        description: TEXTS.TECH_4_DESC,
        example: TEXTS.TECH_4_EXAMPLE,
        icon: 'help-circle',
      },
    ],
    [
      TEXTS.TECH_1_TITLE,
      TEXTS.TECH_1_DESC,
      TEXTS.TECH_1_EXAMPLE,
      TEXTS.TECH_2_TITLE,
      TEXTS.TECH_2_DESC,
      TEXTS.TECH_2_EXAMPLE,
      TEXTS.TECH_3_TITLE,
      TEXTS.TECH_3_DESC,
      TEXTS.TECH_3_EXAMPLE,
      TEXTS.TECH_4_TITLE,
      TEXTS.TECH_4_DESC,
      TEXTS.TECH_4_EXAMPLE,
    ]
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        content: {
          flex: 1,
        },
        scrollView: {
          flex: 1,
        },
        introCenter: {
          textAlign: 'center',
        },
        practiceIcon: {
          alignSelf: 'center',
          marginBottom: 12,
        },
        practiceCenter: {
          textAlign: 'center',
          marginBottom: 8,
        },
      }),
    [colors],
  );

  const handleSelectTechnique = (technique) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTechnique(technique);
    setPracticeText('');
  };

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
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
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={techniqueScreenStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={techniqueScreenStyles.introPanel}>
            <Text style={techniqueScreenStyles.introKicker}>{TEXTS.INTRO_KICKER}</Text>
            <Text style={techniqueScreenStyles.introTitle}>{TEXTS.INTRO_TITLE}</Text>
            <Text style={[techniqueScreenStyles.introText, styles.introCenter]}>
              {TEXTS.INTRO_BODY}
            </Text>
          </View>

          {!selectedTechnique && (
            <View style={techniqueScreenStyles.listGap}>
              {TECHNIQUES.map((technique) => (
                <TouchableOpacity
                  key={technique.id}
                  style={techniqueScreenStyles.card}
                  onPress={() => handleSelectTechnique(technique)}
                >
                  <View style={techniqueScreenStyles.rowHeader}>
                    <View style={techniqueScreenStyles.iconTile}>
                      <MaterialCommunityIcons
                        name={technique.icon}
                        size={28}
                        color={colors.primary}
                      />
                    </View>
                    <View style={techniqueScreenStyles.infoColumn}>
                      <Text style={techniqueScreenStyles.cardTitle}>{technique.title}</Text>
                    </View>
                  </View>
                  <Text style={techniqueScreenStyles.cardBody}>{technique.description}</Text>
                  <Text style={techniqueScreenStyles.practiceExample}>{technique.example}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {selectedTechnique && (
            <View style={techniqueScreenStyles.practiceBlock}>
              <TouchableOpacity
                style={techniqueScreenStyles.inlineBackRow}
                onPress={() => setSelectedTechnique(null)}
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={22}
                  color={colors.primary}
                />
                <Text style={techniqueScreenStyles.inlineBackLabel}>{TEXTS.BACK}</Text>
              </TouchableOpacity>

              <MaterialCommunityIcons
                name={selectedTechnique.icon}
                size={44}
                color={colors.primary}
                style={styles.practiceIcon}
              />
              <Text style={techniqueScreenStyles.formSectionHeading}>
                {selectedTechnique.title}
              </Text>
              <Text style={[techniqueScreenStyles.cardBody, styles.practiceCenter]}>
                {selectedTechnique.description}
              </Text>
              <Text style={techniqueScreenStyles.practiceExample}>
                {selectedTechnique.example}
              </Text>

              <Text style={techniqueScreenStyles.formHint}>
                {TEXTS.PRACTICE_PROMPT}
              </Text>
              <TextInput
                style={[techniqueScreenStyles.textInput, techniqueScreenStyles.textInputTall]}
                placeholder={TEXTS.INPUT_PLACEHOLDER}
                placeholderTextColor={colors.textSecondary}
                value={practiceText}
                onChangeText={setPracticeText}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[
                  techniqueScreenStyles.saveButton,
                  !practiceText.trim() && techniqueScreenStyles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={!practiceText.trim()}
              >
                <Text style={techniqueScreenStyles.saveButtonText}>{TEXTS.SAVE_PRACTICE}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// `styles` se deriva del tema dentro del componente.

export default CommunicationToolScreen;
