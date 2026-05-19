import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ParticleBackground from '../components/ParticleBackground';
import { useTheme } from '../context/ThemeContext';
import { SPACING } from '../constants/ui';
import { useSectionTranslations } from '../hooks/useTranslations';

const PRIVACY_URL = 'https://www.antoapps.com/privacidad';

const DEFAULT_TEXTS = {
  TITLE: 'Privacidad e IA',
  BACK: 'Volver',
  INTRO:
    'Aquí puedes revisar de forma clara qué proveedores de IA usamos, qué datos se comparten y dónde consultar esta información en la app.',
  Q1: '1) ¿Anto usa IA de terceros?',
  A1:
    'Sí. Las respuestas del asistente las genera OpenAI a partir del contexto que Anto arma en sus sistemas (historial permitido, preferencias y reglas del producto). Tareas, hábitos y el resto de la app funcionan integrados en Anto.',
  Q2: '2) ¿Se envían datos de usuarios a IA de terceros?',
  A2:
    'Sí, en la medida necesaria para generar cada respuesta: mensajes del chat, contexto mínimo de conversación y preferencias compartidas en onboarding, según lo que Anto incluya en la petición al proveedor.',
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
  PROVIDERS_TEXT:
    'OpenAI aporta los modelos de lenguaje con los que se redactan las respuestas del asistente. Anto define qué contexto y datos se envían en cada caso y mantiene la lógica del producto en sus servidores.',
  POLICY_BUTTON: 'Abrir Política de Privacidad',
};

const ICON_SIZE = 24;

export default function AIPrivacyScreen() {
  const INFO = useSectionTranslations('INFO');
  const TEXTS = useMemo(
    () => ({ ...DEFAULT_TEXTS, ...(INFO?.AI_PRIVACY || {}) }),
    [INFO],
  );
  const navigation = useNavigation();
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.chromeHeader,
        },
        headerButton: { width: 40, alignItems: 'center', justifyContent: 'center' },
        headerTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
        scrollView: { flex: 1 },
        content: { padding: SPACING.SCREEN_EDGE_INSET, paddingBottom: 36 },
        introText: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginBottom: 16 },
        card: {
          backgroundColor: colors.chromeCard,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.chromeCardBorder,
          padding: 14,
          marginBottom: 12,
        },
        question: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 6 },
        answer: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
        sectionTitle: { color: colors.primary, fontSize: 15, fontWeight: '700', marginBottom: 8 },
        bulletRow: { flexDirection: 'row', marginBottom: 6 },
        bulletDot: { color: colors.primary, marginRight: 8, fontSize: 14 },
        bulletText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, flex: 1 },
        policyButton: {
          marginTop: 8,
          backgroundColor: colors.accentLineSoft,
          borderWidth: 1,
          borderColor: colors.accentLine,
          borderRadius: 10,
          paddingVertical: 12,
          alignItems: 'center',
        },
        policyButtonText: { color: colors.text, fontSize: 14, fontWeight: '700' },
      }),
    [colors],
  );

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
          <MaterialCommunityIcons name="arrow-left" size={ICON_SIZE} color={colors.text} />
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
