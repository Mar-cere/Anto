/**
 * Pantalla de Herramienta de Comunicación
 * Guía interactiva para mejorar la comunicación
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
  const [selectedTechnique, setSelectedTechnique] = useState(null);
  const [practiceText, setPracticeText] = useState('');

  const handleSelectTechnique = (technique) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTechnique(technique);
    setPracticeText('');
  };

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Aquí se podría guardar la práctica
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <Header
        title="Herramienta de Comunicación"
        onBack={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.introText}>
            Estas técnicas te ayudarán a comunicarte de manera más efectiva y empática.
          </Text>

          {/* Lista de técnicas */}
          {!selectedTechnique && (
            <View style={styles.techniquesList}>
              {TECHNIQUES.map((technique) => (
                <TouchableOpacity
                  key={technique.id}
                  style={styles.techniqueCard}
                  onPress={() => handleSelectTechnique(technique)}
                >
                  <View style={styles.techniqueHeader}>
                    <MaterialCommunityIcons
                      name={technique.icon}
                      size={32}
                      color={colors.primary}
                    />
                    <Text style={styles.techniqueTitle}>{technique.title}</Text>
                  </View>
                  <Text style={styles.techniqueDescription}>
                    {technique.description}
                  </Text>
                  <Text style={styles.techniqueExample}>{technique.example}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Vista de práctica */}
          {selectedTechnique && (
            <View style={styles.practiceContainer}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setSelectedTechnique(null)}
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.backButtonText}>Volver</Text>
              </TouchableOpacity>

              <View style={styles.practiceCard}>
                <MaterialCommunityIcons
                  name={selectedTechnique.icon}
                  size={48}
                  color={colors.primary}
                  style={styles.practiceIcon}
                />
                <Text style={styles.practiceTitle}>{selectedTechnique.title}</Text>
                <Text style={styles.practiceDescription}>
                  {selectedTechnique.description}
                </Text>
                <Text style={styles.practiceExample}>
                  {selectedTechnique.example}
                </Text>

                <Text style={styles.practiceLabel}>
                  Practica escribiendo un mensaje usando esta técnica:
                </Text>
                <TextInput
                  style={styles.practiceInput}
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
                    styles.saveButton,
                    !practiceText.trim() && styles.saveButtonDisabled,
                  ]}
                  onPress={handleSave}
                  disabled={!practiceText.trim()}
                >
                  <Text style={styles.saveButtonText}>Guardar Práctica</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  introText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  techniquesList: {
    gap: 16,
  },
  techniqueCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  techniqueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  techniqueTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  techniqueDescription: {
    fontSize: 15,
    color: colors.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  techniqueExample: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  practiceContainer: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  practiceCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  practiceIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  practiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  practiceDescription: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  practiceExample: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 24,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  practiceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  practiceInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    minHeight: 150,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});

export default CommunicationToolScreen;

