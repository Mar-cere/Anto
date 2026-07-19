/**
 * Pantalla Sobre Nosotros / Información de la Aplicación
 * 
 * Muestra información sobre Anto, su misión, valores y equipo.
 * 
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ParticleBackground from '../components/ParticleBackground';
import { useTheme } from '../context/ThemeContext';
import { SPACING } from '../constants/ui';
import { useSectionTranslations } from '../hooks/useTranslations';

// Constantes
const ICON_SIZE = 24;
const DEFAULT_TEXTS = {
  TITLE: 'Sobre Anto',
  BACK: 'Volver',
  MISSION_TITLE: 'Nuestra Misión',
  MISSION_TEXT: 'Anto nace con el propósito de hacer que el apoyo emocional y la salud mental sean accesibles para todos. Creemos que cada persona merece tener un espacio seguro donde pueda expresarse, ser escuchada y recibir apoyo personalizado en su camino hacia el bienestar emocional.',
  VALUES_TITLE: 'Nuestros Valores',
  VALUES: [
    {
      icon: 'heart',
      title: 'Empatía',
      description: 'Entendemos que cada experiencia es única y merece ser validada con compasión y respeto.',
    },
    {
      icon: 'shield-check',
      title: 'Privacidad',
      description: 'Tu información y conversaciones están protegidas con los más altos estándares de seguridad.',
    },
    {
      icon: 'lightbulb-on',
      title: 'Innovación',
      description: 'Utilizamos tecnología de vanguardia para ofrecerte la mejor experiencia de apoyo emocional.',
    },
    {
      icon: 'hand-heart',
      title: 'Accesibilidad',
      description: 'Creemos que el bienestar emocional debe estar al alcance de todos, sin barreras.',
    },
  ],
  TECHNOLOGY_TITLE: 'Tecnología',
  TECHNOLOGY_TEXT: 'Anto utiliza inteligencia artificial avanzada para brindarte respuestas personalizadas y empáticas. Nuestro sistema está diseñado para comprender el contexto emocional, detectar situaciones de crisis y ofrecer apoyo adaptado a tus necesidades específicas.',
  TEAM_TITLE: 'Nuestro Compromiso',
  TEAM_TEXT: 'Estamos comprometidos con tu bienestar. Trabajamos constantemente para mejorar Anto, agregar nuevas funcionalidades y asegurar que siempre tengas el mejor apoyo posible en tu camino hacia una mejor salud mental.',
  AI_TITLE: 'Cómo usamos IA',
  AI_TEXT:
    'Anto combina modelos de lenguaje de OpenAI para redactar las respuestas del asistente con el contexto y la lógica que prepara en sus servidores, junto a tareas, hábitos y el resto de funciones de la app. Más detalle en Privacidad e IA y en la Política de Privacidad.',
  AI_CTA: 'Ver Privacidad e IA en la app',
  AI_CTA_HINT: 'Datos enviados, proveedor y dónde consultarlo',
  CONTACT_TITLE: 'Contáctanos',
  CONTACT_EMAIL: 'marcelo.ull@antoapps.com',
  LEGAL_TITLE: 'Legal',
  TERMS_LINK: 'Términos de Servicio',
  PRIVACY_LINK: 'Política de Privacidad',
  VERSION_LABEL: 'Versión',
};

const AboutScreen = () => {
  const INFO = useSectionTranslations('INFO');
  const TEXTS = useMemo(
    () => ({ ...DEFAULT_TEXTS, ...(INFO?.ABOUT || {}) }),
    [INFO],
  );
  const APP_VERSION_LABEL = `${TEXTS.VERSION_LABEL} ${Constants.expoConfig?.version ?? '-'}`;
  const navigation = useNavigation();
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingVertical: SPACING.CHIP_INSET,
          marginBottom: 8,
        },
        headerButton: {
          width: 40,
          height: 40,
          justifyContent: 'center',
          alignItems: 'center',
        },
        headerTitle: {
          fontSize: 20,
          fontWeight: 'bold',
          color: colors.text,
        },
        scrollView: {
          flex: 1,
        },
        scrollContent: {
          padding: SPACING.SCREEN_EDGE_INSET,
          paddingBottom: SPACING.xl,
        },
        section: {
          marginBottom: 32,
        },
        sectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 16,
          gap: SPACING.CHIP_INSET,
        },
        sectionTitle: {
          fontSize: 22,
          fontWeight: 'bold',
          color: colors.text,
        },
        sectionText: {
          fontSize: 16,
          lineHeight: 24,
          color: colors.textSecondary,
          textAlign: 'justify',
        },
        valueCard: {
          flexDirection: 'row',
          backgroundColor: colors.chromeCard,
          borderRadius: 12,
          padding: SPACING.CARD_INNER_INSET,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: colors.chromeCardBorder,
        },
        valueIconContainer: {
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.accentLineSoft,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 16,
        },
        valueContent: {
          flex: 1,
        },
        valueTitle: {
          fontSize: 18,
          fontWeight: '600',
          color: colors.text,
          marginBottom: 6,
        },
        valueDescription: {
          fontSize: 14,
          lineHeight: 20,
          color: colors.textSecondary,
        },
        contactButton: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.chromeCard,
          borderRadius: 12,
          padding: SPACING.CARD_INNER_INSET,
          borderWidth: 1,
          borderColor: colors.chromeCardBorder,
          gap: SPACING.CHIP_INSET,
        },
        contactEmail: {
          fontSize: 16,
          color: colors.primary,
          fontWeight: '500',
        },
        legalButton: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.chromeCard,
          borderRadius: 12,
          padding: SPACING.CARD_INNER_INSET,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: colors.chromeCardBorder,
          gap: SPACING.CHIP_INSET,
        },
        legalLinkText: {
          flex: 1,
          fontSize: 16,
          color: colors.primary,
          fontWeight: '500',
        },
        aiCtaButton: {
          marginTop: 16,
        },
        aiCtaTextWrap: {
          flex: 1,
        },
        aiCtaTitle: {
          fontSize: 16,
          color: colors.primary,
          fontWeight: '600',
        },
        aiCtaHint: {
          fontSize: 13,
          color: colors.textSecondary,
          marginTop: 4,
        },
        versionContainer: {
          alignItems: 'center',
          marginTop: 16,
          paddingTop: SPACING.HERO_INSET,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        versionText: {
          fontSize: 14,
          color: colors.textSecondary,
        },
      }),
    [colors],
  );

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ParticleBackground />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={handleGoBack}
          accessibilityLabel={TEXTS.BACK}
        >
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={ICON_SIZE} 
            color={colors.text} 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{TEXTS.TITLE}</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Misión */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons 
              name="target" 
              size={28} 
              color={colors.primary} 
            />
            <Text style={styles.sectionTitle}>{TEXTS.MISSION_TITLE}</Text>
          </View>
          <Text style={styles.sectionText}>{TEXTS.MISSION_TEXT}</Text>
        </View>

        {/* Valores */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons 
              name="star-circle" 
              size={28} 
              color={colors.primary} 
            />
            <Text style={styles.sectionTitle}>{TEXTS.VALUES_TITLE}</Text>
          </View>
          {TEXTS.VALUES.map((value, index) => (
            <View key={index} style={styles.valueCard}>
              <View style={styles.valueIconContainer}>
                <MaterialCommunityIcons 
                  name={value.icon} 
                  size={24} 
                  color={colors.primary} 
                />
              </View>
              <View style={styles.valueContent}>
                <Text style={styles.valueTitle}>{value.title}</Text>
                <Text style={styles.valueDescription}>{value.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Tecnología */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons 
              name="robot" 
              size={28} 
              color={colors.primary} 
            />
            <Text style={styles.sectionTitle}>{TEXTS.TECHNOLOGY_TITLE}</Text>
          </View>
          <Text style={styles.sectionText}>{TEXTS.TECHNOLOGY_TEXT}</Text>
        </View>

        {/* Compromiso */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons 
              name="handshake" 
              size={28} 
              color={colors.primary} 
            />
            <Text style={styles.sectionTitle}>{TEXTS.TEAM_TITLE}</Text>
          </View>
          <Text style={styles.sectionText}>{TEXTS.TEAM_TEXT}</Text>
        </View>

        {/* Transparencia IA */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="brain"
              size={28}
              color={colors.primary}
            />
            <Text style={styles.sectionTitle}>{TEXTS.AI_TITLE}</Text>
          </View>
          <Text style={styles.sectionText}>{TEXTS.AI_TEXT}</Text>
          <TouchableOpacity
            style={[styles.legalButton, styles.aiCtaButton]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('AIPrivacy');
            }}
            accessibilityRole="button"
            accessibilityLabel={`${TEXTS.AI_CTA}. ${TEXTS.AI_CTA_HINT}`}
          >
            <MaterialCommunityIcons
              name="shield-account-outline"
              size={20}
              color={colors.primary}
            />
            <View style={styles.aiCtaTextWrap}>
              <Text style={styles.aiCtaTitle}>{TEXTS.AI_CTA}</Text>
              <Text style={styles.aiCtaHint}>{TEXTS.AI_CTA_HINT}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Contacto */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons 
              name="email" 
              size={28} 
              color={colors.primary} 
            />
            <Text style={styles.sectionTitle}>{TEXTS.CONTACT_TITLE}</Text>
          </View>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Aquí se podría abrir el cliente de email
            }}
          >
            <MaterialCommunityIcons 
              name="email-outline" 
              size={20} 
              color={colors.primary} 
            />
            <Text style={styles.contactEmail}>{TEXTS.CONTACT_EMAIL}</Text>
          </TouchableOpacity>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons 
              name="file-document-outline" 
              size={28} 
              color={colors.primary} 
            />
            <Text style={styles.sectionTitle}>{TEXTS.LEGAL_TITLE}</Text>
          </View>
          <TouchableOpacity 
            style={styles.legalButton}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const url = 'https://www.antoapps.com/terminos';
              const canOpen = await Linking.canOpenURL(url);
              if (canOpen) {
                await Linking.openURL(url);
              }
            }}
          >
            <MaterialCommunityIcons 
              name="file-document" 
              size={20} 
              color={colors.primary} 
            />
            <Text style={styles.legalLinkText}>{TEXTS.TERMS_LINK}</Text>
            <MaterialCommunityIcons 
              name="open-in-new" 
              size={16} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.legalButton}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const url = 'https://www.antoapps.com/privacidad';
              const canOpen = await Linking.canOpenURL(url);
              if (canOpen) {
                await Linking.openURL(url);
              }
            }}
          >
            <MaterialCommunityIcons 
              name="shield-lock-outline" 
              size={20} 
              color={colors.primary} 
            />
            <Text style={styles.legalLinkText}>{TEXTS.PRIVACY_LINK}</Text>
            <MaterialCommunityIcons 
              name="open-in-new" 
              size={16} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>

        {/* Versión */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>{APP_VERSION_LABEL}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AboutScreen;

