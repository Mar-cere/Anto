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
import { colors } from '../../styles/globalStyles';

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
      // Aquí podrías guardar el recuerdo
      setMemoryText('');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <Header
        title="Apoyo en Duelo"
        onBack={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.introContainer}>
            <Text style={styles.introTitle}>🕯️ Apoyo en el duelo</Text>
            <Text style={styles.introText}>
              El duelo es un proceso único para cada persona. No hay una forma "correcta" de sentirlo.
              Tómate el tiempo que necesites.
            </Text>
          </View>

          {GRIEF_RESOURCES.map(resource => (
            <View key={resource.id} style={styles.resourceCard}>
              <View style={styles.resourceHeader}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name={resource.icon}
                    size={32}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceTitle}>{resource.title}</Text>
                </View>
              </View>
              <Text style={styles.resourceDescription}>{resource.description}</Text>
            </View>
          ))}

          <View style={styles.memoryContainer}>
            <Text style={styles.memoryTitle}>Ejercicio: Escribe un recuerdo</Text>
            <Text style={styles.memorySubtitle}>
              Escribir sobre los recuerdos que tienes puede ayudarte a procesar el duelo.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Escribe un recuerdo especial que quieras preservar..."
              placeholderTextColor={colors.textSecondary}
              value={memoryText}
              onChangeText={setMemoryText}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.saveButton, !memoryText.trim() && styles.saveButtonDisabled]}
              onPress={handleSaveMemory}
              disabled={!memoryText.trim()}
            >
              <Text style={styles.saveButtonText}>Guardar Recuerdo</Text>
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
  resourceCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resourceHeader: {
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
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  resourceDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  memoryContainer: {
    marginTop: 20,
  },
  memoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  memorySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 15,
    lineHeight: 20,
  },
  input: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    color: colors.white,
    fontSize: 16,
    minHeight: 150,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GriefSupportScreen;

