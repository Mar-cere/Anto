import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ParticleBackground from '../components/ParticleBackground';
import { colors } from '../styles/globalStyles';

const PRIVACY_URL = 'https://www.antoapps.com/privacidad';

const TEXTS = {
  TITLE: 'Privacidad e IA',
  BACK: 'Volver',
  INTRO:
    'Aquí puedes revisar de forma clara qué proveedores de IA usamos, qué datos se comparten y dónde consultar esta información en la app.',
  Q1: '1) ¿Anto usa IA de terceros?',
  A1: 'Sí. Anto utiliza OpenAI para generar respuestas en el chat terapéutico.',
  Q2: '2) ¿Se envían datos de usuarios a IA de terceros?',
  A2:
    'Sí. Para poder responder, se envían los mensajes del chat, contexto mínimo de conversación y preferencias compartidas en onboarding.',
  Q3: '3) ¿Dónde puedes revisar esta información dentro de la app?',
  A3:
    'En esta pantalla (Ajustes > Privacidad e IA), en el modal de transparencia del chat y en la Política de Privacidad.',
  DATA_TITLE: 'Datos que pueden procesarse',
  DATA_ITEMS: [
    'Mensajes escritos en el chat',
    'Contexto mínimo de conversación para continuidad',
    'Preferencias de estilo y onboarding para personalización',
    'Si tienes notificaciones activas, en momentos muy intensos puede enviarse un recordatorio suave para invitarte a volver al chat (no sustituye ayuda profesional ni emergencias)',
  ],
  PROVIDERS_TITLE: 'Proveedor de terceros',
  PROVIDERS_TEXT: 'OpenAI (proveedor de IA para generación de respuestas del chat).',
  POLICY_BUTTON: 'Abrir Política de Privacidad',
};

const ICON_SIZE = 24;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26, 221, 219, 0.2)',
    backgroundColor: 'rgba(12, 20, 56, 0.9)',
  },
  headerButton: { width: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
  scrollView: { flex: 1 },
  content: { padding: 16, paddingBottom: 36 },
  introText: { color: '#D8E3FF', fontSize: 14, lineHeight: 21, marginBottom: 16 },
  card: {
    backgroundColor: 'rgba(29, 43, 95, 0.85)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(26, 221, 219, 0.14)',
    padding: 14,
    marginBottom: 12,
  },
  question: { color: colors.white, fontSize: 15, fontWeight: '700', marginBottom: 6 },
  answer: { color: '#C8D6FF', fontSize: 14, lineHeight: 20 },
  sectionTitle: { color: '#A3B8E8', fontSize: 15, fontWeight: '700', marginBottom: 8 },
  bulletRow: { flexDirection: 'row', marginBottom: 6 },
  bulletDot: { color: '#1ADDDb', marginRight: 8, fontSize: 14 },
  bulletText: { color: '#C8D6FF', fontSize: 14, lineHeight: 20, flex: 1 },
  policyButton: {
    marginTop: 8,
    backgroundColor: 'rgba(26, 221, 219, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(26, 221, 219, 0.45)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  policyButtonText: { color: colors.white, fontSize: 14, fontWeight: '700' },
});

export default function AIPrivacyScreen() {
  const navigation = useNavigation();

  const handleOpenPolicy = async () => {
    try {
      const canOpen = await Linking.canOpenURL(PRIVACY_URL);
      if (canOpen) await Linking.openURL(PRIVACY_URL);
    } catch (e) {
      console.warn('No se pudo abrir política de privacidad:', e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ParticleBackground />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel={TEXTS.BACK}
        >
          <MaterialCommunityIcons name="arrow-left" size={ICON_SIZE} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{TEXTS.TITLE}</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.introText}>{TEXTS.INTRO}</Text>

        <View style={styles.card}>
          <Text style={styles.question}>{TEXTS.Q1}</Text>
          <Text style={styles.answer}>{TEXTS.A1}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.question}>{TEXTS.Q2}</Text>
          <Text style={styles.answer}>{TEXTS.A2}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.question}>{TEXTS.Q3}</Text>
          <Text style={styles.answer}>{TEXTS.A3}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{TEXTS.DATA_TITLE}</Text>
          {TEXTS.DATA_ITEMS.map((item) => (
            <View key={item} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{TEXTS.PROVIDERS_TITLE}</Text>
          <Text style={styles.answer}>{TEXTS.PROVIDERS_TEXT}</Text>
          <TouchableOpacity style={styles.policyButton} onPress={handleOpenPolicy}>
            <Text style={styles.policyButtonText}>{TEXTS.POLICY_BUTTON}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
