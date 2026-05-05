/**
 * Pantalla de Apoyo en Duelo
 * Recursos y ejercicios para procesar el duelo
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
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
import { colors } from '../../styles/globalStyles';
import { FOCUS_META } from '../../styles/focusCardTheme';
import { techniqueScreenStyles } from './techniqueScreenStyles';

const GRIEF_RESOURCES = [
  {
    id: 1,
    title: 'Permítete sentir',
    description: 'El duelo es un proceso natural. Permítete sentir todas las emociones que surgen, sin juzgarlas.',
    icon: 'heart',
  },
  {
    id: 2,
    title: 'Habla sobre tus sentimientos',
    description: 'Compartir tus sentimientos con alguien de confianza puede ser muy sanador.',
    icon: 'account-group',
  },
  {
    id: 3,
    title: 'Crea rituales de recuerdo',
    description: 'Crea rituales que te ayuden a honrar la memoria de quien perdiste.',
    icon: 'candle',
  },
  {
    id: 4,
    title: 'Busca apoyo profesional',
    description: 'No dudes en buscar ayuda profesional si sientes que el duelo te está abrumando.',
    icon: 'medical-bag',
  },
];

const GriefSupportScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [memoryText, setMemoryText] = useState('');

  const handleSaveMemory = () => {
    if (memoryText.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMemoryText('');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <ParticleBackground />
      <Header
        title="Apoyo en Duelo"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={techniqueScreenStyles.scrollContent}>
          <View style={techniqueScreenStyles.introPanel}>
            <Text style={techniqueScreenStyles.introKicker}>Duelo</Text>
            <Text style={techniqueScreenStyles.introTitle}>Apoyo en el proceso</Text>
            <Text style={techniqueScreenStyles.introText}>
              El duelo es único para cada persona. No hay una forma correcta de sentirlo.
              Tómate el tiempo que necesites.
            </Text>
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
            <Text style={techniqueScreenStyles.formSectionHeading}>Ejercicio: escribe un recuerdo</Text>
            <Text style={techniqueScreenStyles.formHint}>
              Escribir sobre los recuerdos que tienes puede ayudarte a procesar el duelo.
            </Text>
            <TextInput
              style={[techniqueScreenStyles.textInput, techniqueScreenStyles.textInputTall]}
              placeholder="Escribe un recuerdo especial que quieras preservar..."
              placeholderTextColor={FOCUS_META}
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
              <Text style={techniqueScreenStyles.saveButtonText}>Guardar recuerdo</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
});

export default GriefSupportScreen;
