/**
 * Pantalla de Establecer Límites
 * Guía para establecer límites saludables
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

const BOUNDARY_GUIDES = [
  {
    id: 1,
    title: 'Identifica tus límites',
    description: 'Piensa en situaciones donde te sientes incómodo o sobrecargado. Estos son indicadores de que necesitas establecer límites.',
    icon: 'lightbulb-on',
  },
  {
    id: 2,
    title: 'Comunica claramente',
    description: 'Sé claro y directo al comunicar tus límites. Usa frases como "No puedo hacer eso" o "Necesito que respetes mi tiempo".',
    icon: 'message-text',
  },
  {
    id: 3,
    title: 'Mantén tu posición',
    description: 'Es normal que otros prueben tus límites. Mantén tu posición con amabilidad pero firmeza.',
    icon: 'shield-check',
  },
  {
    id: 4,
    title: 'Practica el autocuidado',
    description: 'Establecer límites es una forma de autocuidado. No te sientas culpable por priorizar tu bienestar.',
    icon: 'heart',
  },
];

const BoundarySettingScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [boundaryText, setBoundaryText] = useState('');

  const handleSave = () => {
    if (boundaryText.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Aquí podrías guardar el límite establecido
      setBoundaryText('');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <Header
        title="Establecer Límites"
        onBack={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.introContainer}>
            <Text style={styles.introTitle}>🛡️ Establece límites saludables</Text>
            <Text style={styles.introText}>
              Los límites son importantes para tu bienestar. Te ayudan a proteger tu tiempo, energía y salud mental.
            </Text>
          </View>

          {BOUNDARY_GUIDES.map(guide => (
            <View key={guide.id} style={styles.guideCard}>
              <View style={styles.guideHeader}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name={guide.icon}
                    size={32}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.guideInfo}>
                  <Text style={styles.guideTitle}>{guide.title}</Text>
                </View>
              </View>
              <Text style={styles.guideDescription}>{guide.description}</Text>
            </View>
          ))}

          <View style={styles.practiceContainer}>
            <Text style={styles.practiceTitle}>Práctica: Escribe un límite que quieras establecer</Text>
            <TextInput
              style={styles.input}
              placeholder="Ejemplo: No responderé mensajes de trabajo después de las 8 PM"
              placeholderTextColor={colors.textSecondary}
              value={boundaryText}
              onChangeText={setBoundaryText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.saveButton, !boundaryText.trim() && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!boundaryText.trim()}
            >
              <Text style={styles.saveButtonText}>Guardar</Text>
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
  guideCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  guideHeader: {
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
  guideInfo: {
    flex: 1,
  },
  guideTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  guideDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  practiceContainer: {
    marginTop: 20,
  },
  practiceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 15,
  },
  input: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    color: colors.white,
    fontSize: 16,
    minHeight: 100,
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

export default BoundarySettingScreen;

