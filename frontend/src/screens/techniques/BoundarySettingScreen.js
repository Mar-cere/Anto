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
import { useTechniqueScreenStyles } from './techniqueScreenStyles';

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
      setBoundaryText('');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <ParticleBackground />
      <Header
        title="Establecer Límites"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={techniqueScreenStyles.scrollContent}>
          <View style={techniqueScreenStyles.introPanel}>
            <Text style={techniqueScreenStyles.introKicker}>Límites</Text>
            <Text style={techniqueScreenStyles.introTitle}>Establece límites saludables</Text>
            <Text style={techniqueScreenStyles.introText}>
              Los límites son importantes para tu bienestar. Te ayudan a proteger tu tiempo, energía y salud mental.
            </Text>
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
              Práctica: escribe un límite que quieras establecer
            </Text>
            <TextInput
              style={techniqueScreenStyles.textInput}
              placeholder='Ejemplo: No responderé mensajes de trabajo después de las 8 PM'
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
              <Text style={techniqueScreenStyles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default BoundarySettingScreen;
