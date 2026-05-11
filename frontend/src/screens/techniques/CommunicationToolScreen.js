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
import { useTechniqueScreenStyles } from './techniqueScreenStyles';

const TECHNIQUES = [
  {
    id: 1,
    title: 'Mensajes "Yo"',
    description: 'Expresa tus sentimientos usando "Yo siento..." en lugar de "Tú haces..."',
    example: 'Ejemplo: "Yo me siento herido cuando..." en lugar de "Tú siempre haces..."',
    icon: 'account',
  },
  {
    id: 2,
    title: 'Escucha Activa',
    description: 'Practica escuchar sin interrumpir y reflejar lo que escuchas.',
    example: 'Ejemplo: "Entiendo que te sientes... ¿Es correcto?"',
    icon: 'ear-hearing',
  },
  {
    id: 3,
    title: 'Validación',
    description: 'Reconoce y valida los sentimientos de la otra persona.',
    example: 'Ejemplo: "Tiene sentido que te sientas así..."',
    icon: 'check-circle',
  },
  {
    id: 4,
    title: 'Preguntas Abiertas',
    description: 'Haz preguntas que inviten a la reflexión y el diálogo.',
    example: 'Ejemplo: "¿Cómo te gustaría que fuera diferente?"',
    icon: 'help-circle',
  },
];

const CommunicationToolScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle } = useTheme();
  const techniqueScreenStyles = useTechniqueScreenStyles();
  const [selectedTechnique, setSelectedTechnique] = useState(null);
  const [practiceText, setPracticeText] = useState('');

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
        title="Herramienta de Comunicación"
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
            <Text style={techniqueScreenStyles.introKicker}>Comunicación</Text>
            <Text style={techniqueScreenStyles.introTitle}>Herramientas empáticas</Text>
            <Text style={[techniqueScreenStyles.introText, styles.introCenter]}>
              Estas técnicas te ayudarán a comunicarte de manera más efectiva y empática.
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
                <Text style={techniqueScreenStyles.inlineBackLabel}>Volver</Text>
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
                Practica escribiendo un mensaje usando esta técnica:
              </Text>
              <TextInput
                style={[techniqueScreenStyles.textInput, techniqueScreenStyles.textInputTall]}
                placeholder="Escribe tu mensaje aquí..."
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
                <Text style={techniqueScreenStyles.saveButtonText}>Guardar práctica</Text>
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
