/**
 * Pantalla Sobre Nosotros / Información de la Aplicación
 * 
 * Muestra información sobre Anto, su misión, valores y equipo.
 * 
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../styles/globalStyles';
import ParticleBackground from '../components/ParticleBackground';

// Constantes
const ICON_SIZE = 24;
const COLORS = {
  BACKGROUND: colors.background,
  PRIMARY: colors.primary,
  WHITE: colors.white,
  ACCENT: '#A3B8E8',
  TEXT_SECONDARY: '#B0B0B0',
};

const TEXTS = {
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
  CONTACT_TITLE: 'Contáctanos',
  CONTACT_EMAIL: 'marcelo.ull@antoapps.com',
  LEGAL_TITLE: 'Legal',
  TERMS_LINK: 'Términos de Servicio',
  PRIVACY_LINK: 'Política de Privacidad',
  VERSION: 'Versión 1.0.0',
};

const AboutScreen = () => {
  const navigation = useNavigation();

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
            color={COLORS.WHITE} 
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
              color={COLORS.PRIMARY} 
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
              color={COLORS.PRIMARY} 
            />
            <Text style={styles.sectionTitle}>{TEXTS.VALUES_TITLE}</Text>
          </View>
          {TEXTS.VALUES.map((value, index) => (
            <View key={index} style={styles.valueCard}>
              <View style={styles.valueIconContainer}>
                <MaterialCommunityIcons 
                  name={value.icon} 
                  size={24} 
                  color={COLORS.PRIMARY} 
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
              color={COLORS.PRIMARY} 
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
              color={COLORS.PRIMARY} 
            />
            <Text style={styles.sectionTitle}>{TEXTS.TEAM_TITLE}</Text>
          </View>
          <Text style={styles.sectionText}>{TEXTS.TEAM_TEXT}</Text>
        </View>

        {/* Contacto */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons 
              name="email" 
              size={28} 
              color={COLORS.PRIMARY} 
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
              color={COLORS.PRIMARY} 
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
              color={COLORS.PRIMARY} 
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
              color={COLORS.PRIMARY} 
            />
            <Text style={styles.legalLinkText}>{TEXTS.TERMS_LINK}</Text>
            <MaterialCommunityIcons 
              name="open-in-new" 
              size={16} 
              color={COLORS.TEXT_SECONDARY} 
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
              color={COLORS.PRIMARY} 
            />
            <Text style={styles.legalLinkText}>{TEXTS.PRIVACY_LINK}</Text>
            <MaterialCommunityIcons 
              name="open-in-new" 
              size={16} 
              color={COLORS.TEXT_SECONDARY} 
            />
          </TouchableOpacity>
        </View>

        {/* Versión */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>{TEXTS.VERSION}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    color: COLORS.WHITE,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'justify',
  },
  valueCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(29, 43, 95, 0.6)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(26, 221, 219, 0.1)',
  },
  valueIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(26, 221, 219, 0.1)',
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
    color: COLORS.WHITE,
    marginBottom: 6,
  },
  valueDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.TEXT_SECONDARY,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 43, 95, 0.6)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(26, 221, 219, 0.1)',
    gap: 12,
  },
  contactEmail: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  legalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 43, 95, 0.6)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(26, 221, 219, 0.1)',
    gap: 12,
  },
  legalLinkText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(26, 221, 219, 0.1)',
  },
  versionText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
});

export default AboutScreen;

