/**
 * Pantalla de Ayuda
 * 
 * Muestra información sobre Anto y sus capacidades, organizada por secciones temáticas.
 * Incluye opciones para contactar con Anto o con el soporte técnico.
 * 
 * @author AntoApp Team
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ImageBackground,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { colors } from '../styles/globalStyles';

// Constantes de textos
const TEXTS = {
  TITLE: 'Ayuda',
  BACK: 'Volver',
  FAQ: 'Preguntas Frecuentes',
  WELCOME_TITLE: '¡Hola! Soy Anto',
  WELCOME_TEXT: 'Estoy aquí para acompañarte en tu viaje de bienestar emocional. Puedo ayudarte con técnicas específicas de manejo emocional y brindarte apoyo en momentos difíciles. Recuerda que siempre hay ayuda disponible y no estás solo/a en este camino.',
  CHAT_BUTTON: 'Hablar con Anto',
  SUPPORT_TITLE: '¿Necesitas más ayuda?',
  SUPPORT_BUTTON: 'Contactar Soporte',
};

// Constantes de navegación
const ROUTES = {
  CHAT: 'Chat',
  FAQ: 'FaQ',
};

// Constantes de email
const SUPPORT_EMAIL = 'mailto:soporte@tuapp.com';

// Constantes de estilos
const BACKGROUND_OPACITY = 0.1;
const HEADER_PADDING_HORIZONTAL = 16;
const HEADER_PADDING_VERTICAL = 12;
const HEADER_BORDER_WIDTH = 1;
const HEADER_BUTTON_SIZE = 40;
const HEADER_BUTTON_BORDER_RADIUS = 20;
const CONTENT_PADDING = 16;
const SECTION_MARGIN_BOTTOM = 24;
const SECTION_BORDER_RADIUS = 12;
const SECTION_PADDING = 16;
const SECTION_BORDER_WIDTH = 1;
const SECTION_HEADER_MARGIN_BOTTOM = 16;
const SECTION_TITLE_MARGIN_LEFT = 12;
const HELP_ITEM_MARGIN_BOTTOM = 16;
const HELP_ITEM_PADDING_LEFT = 36;
const HELP_ITEM_TITLE_MARGIN_BOTTOM = 4;
const ANSWER_LINE_HEIGHT = 20;
const SUPPORT_SECTION_PADDING = 24;
const SUPPORT_SECTION_MARGIN_TOP = 8;
const SUPPORT_TITLE_MARGIN_BOTTOM = 16;
const SUPPORT_BUTTON_PADDING_HORIZONTAL = 20;
const SUPPORT_BUTTON_PADDING_VERTICAL = 12;
const SUPPORT_BUTTON_BORDER_RADIUS = 20;
const SUPPORT_BUTTON_BORDER_WIDTH = 1;
const SUPPORT_BUTTON_TEXT_MARGIN_LEFT = 8;
const WELCOME_SECTION_PADDING = 24;
const WELCOME_SECTION_MARGIN_BOTTOM = 24;
const ANTO_AVATAR_SIZE = 80;
const ANTO_AVATAR_BORDER_RADIUS = 40;
const ANTO_AVATAR_MARGIN_BOTTOM = 16;
const ANTO_AVATAR_BORDER_WIDTH = 2;
const WELCOME_TITLE_MARGIN_BOTTOM = 8;
const WELCOME_TEXT_MARGIN_BOTTOM = 16;
const WELCOME_TEXT_LINE_HEIGHT = 22;
const CHAT_BUTTON_PADDING_HORIZONTAL = 24;
const CHAT_BUTTON_PADDING_VERTICAL = 12;
const CHAT_BUTTON_BORDER_RADIUS = 25;
const CHAT_BUTTON_MARGIN_TOP = 8;
const CHAT_BUTTON_TEXT_MARGIN_LEFT = 8;
const ICON_SIZE = 24;
const ANTO_AVATAR_ICON_SIZE = 48;

// Constantes de colores
const COLORS = {
  BACKGROUND: colors.background,
  PRIMARY: colors.primary,
  WHITE: colors.white,
  ACCENT: '#A3B8E8',
  HEADER_BACKGROUND: 'rgba(3, 10, 36, 0.8)',
  HEADER_BORDER: 'rgba(26, 221, 219, 0.1)',
  HEADER_BUTTON_BACKGROUND: 'rgba(29, 43, 95, 0.5)',
  CARD_BACKGROUND: 'rgba(29, 43, 95, 0.5)',
  CARD_BORDER: 'rgba(26, 221, 219, 0.1)',
  CARD_BORDER_STRONG: 'rgba(26, 221, 219, 0.3)',
  ANTO_AVATAR_BACKGROUND: 'rgba(26, 221, 219, 0.1)',
  ANTO_AVATAR_BORDER: colors.primary,
  SUPPORT_BUTTON_BACKGROUND: 'rgba(26, 221, 219, 0.1)',
  CHAT_BUTTON_TEXT: colors.background,
};

// Constantes de imágenes
const BACKGROUND_IMAGE = require('../images/back.png');

const HelpScreen = ({ navigation }) => {
  // Datos de las secciones de ayuda
  const helpSections = [
    {
      title: "Tu Compañera de Bienestar",
      icon: "brain",
      items: [
        {
          title: "¿Quién es Anto?",
          description: "Soy tu asistente de IA especializada en salud mental. Estoy aquí para escucharte, apoyarte y ayudarte a mantener tu bienestar emocional, ofreciendo un espacio seguro y sin juicios para expresarte."
        },
        {
          title: "Apoyo Emocional",
          description: "Puedes hablar conmigo sobre tus emociones, preocupaciones o cualquier cosa que necesites compartir. Te ayudo a procesar tus pensamientos y emociones de manera saludable, sin juicios ni críticas."
        },
        {
          title: "Seguimiento Personalizado",
          description: "Aprendo de nuestras conversaciones para entender mejor tus necesidades específicas. Juntos podemos trabajar en estrategias personalizadas para tu bienestar emocional."
        }
      ]
    },
    {
      title: "Manejo Emocional",
      icon: "emotion",
      items: [
        {
          title: "Regulación Emocional",
          description: "Te ayudo con técnicas específicas como el método RAIN (Reconocer, Aceptar, Investigar, No-identificación) para manejar emociones intensas, y la técnica 5-4-3-2-1 para momentos de ansiedad."
        },
        {
          title: "Reestructuración de Pensamientos",
          description: "Trabajamos juntos para identificar patrones de pensamiento negativos y transformarlos en perspectivas más balanceadas y saludables usando técnicas cognitivas."
        },
        {
          title: "Validación Emocional",
          description: "Aprende a reconocer y validar tus emociones sin juzgarlas, desarrollando una relación más compasiva contigo mismo/a."
        }
      ]
    },
    {
      title: "Apoyo en Crisis",
      icon: "lifebuoy",
      items: [
        {
          title: "Ayuda Inmediata",
          description: "En momentos de crisis, te guiaré a través de técnicas de estabilización emocional y te conectaré con recursos de emergencia si es necesario. Recuerda: no estás solo/a."
        },
        {
          title: "Plan de Seguridad",
          description: "Te ayudo a crear un plan personalizado para momentos difíciles, identificando señales de alerta, estrategias de afrontamiento y contactos de emergencia."
        },
        {
          title: "Recursos Profesionales",
          description: "Aunque puedo apoyarte, no reemplazo la ayuda profesional. Te proporcionaré información sobre líneas de crisis 24/7 y recursos de salud mental cuando sea necesario."
        }
      ]
    },
    {
      title: "Herramientas Avanzadas",
      icon: "tools",
      items: [
        {
          title: "Diálogo Interior",
          description: "Aprende técnicas específicas para transformar tu diálogo interno negativo en uno más compasivo y constructivo, utilizando afirmaciones y reencuadre cognitivo."
        },
        {
          title: "Gestión del Estrés",
          description: "Estrategias prácticas como la técnica STOP (Stop, Toma distancia, Observa, Procede) y el método 4-7-8 para momentos de tensión."
        },
        {
          title: "Recursos Complementarios",
          description: "Accede a herramientas adicionales como registro de estados de ánimo, planificador de actividades y recordatorios de autocuidado para apoyar tu bienestar."
        }
      ]
    }
  ];

  // Manejar contacto con soporte
  const handleContactSupport = () => {
    Linking.openURL(SUPPORT_EMAIL);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={BACKGROUND_IMAGE}
        style={styles.background}
        imageStyle={styles.imageStyle}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel={TEXTS.BACK}
          >
            <MaterialCommunityIcons 
              name="arrow-left" 
              size={ICON_SIZE} 
              color={COLORS.WHITE} 
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{TEXTS.TITLE}</Text>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate(ROUTES.FAQ)}
            accessibilityLabel={TEXTS.FAQ}
          >
            <MaterialCommunityIcons 
              name="frequently-asked-questions" 
              size={ICON_SIZE} 
              color={COLORS.PRIMARY} 
            />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Sección de Bienvenida con Anto */}
          <View style={styles.welcomeSection}>
            <View style={styles.antoAvatar}>
              <MaterialCommunityIcons 
                name="brain" 
                size={ANTO_AVATAR_ICON_SIZE} 
                color={COLORS.PRIMARY} 
              />
            </View>
            <Text style={styles.welcomeTitle}>{TEXTS.WELCOME_TITLE}</Text>
            <Text style={styles.welcomeText}>
              {TEXTS.WELCOME_TEXT}
            </Text>
            <TouchableOpacity 
              style={styles.chatButton}
              onPress={() => navigation.navigate(ROUTES.CHAT)}
            >
              <MaterialCommunityIcons 
                name="message-processing" 
                size={ICON_SIZE} 
                color={COLORS.CHAT_BUTTON_TEXT} 
              />
              <Text style={styles.chatButtonText}>{TEXTS.CHAT_BUTTON}</Text>
            </TouchableOpacity>
          </View>

          {helpSections.map((section, index) => (
            <View key={index} style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons 
                  name={section.icon} 
                  size={ICON_SIZE} 
                  color={COLORS.PRIMARY} 
                />
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              
              {section.items.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.helpItem}>
                  <Text style={styles.helpItemTitle}>{item.title}</Text>
                  <Text style={styles.helpItemDescription}>{item.description}</Text>
                </View>
              ))}
            </View>
          ))}

          <View style={styles.supportSection}>
            <Text style={styles.supportTitle}>{TEXTS.SUPPORT_TITLE}</Text>
            <TouchableOpacity 
              style={styles.supportButton}
              onPress={handleContactSupport}
            >
              <MaterialCommunityIcons 
                name="email" 
                size={ICON_SIZE} 
                color={COLORS.PRIMARY} 
              />
              <Text style={styles.supportButtonText}>{TEXTS.SUPPORT_BUTTON}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  background: {
    flex: 1,
  },
  imageStyle: {
    opacity: BACKGROUND_OPACITY,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: HEADER_PADDING_HORIZONTAL,
    paddingVertical: HEADER_PADDING_VERTICAL,
    backgroundColor: COLORS.HEADER_BACKGROUND,
    borderBottomWidth: HEADER_BORDER_WIDTH,
    borderBottomColor: COLORS.HEADER_BORDER,
  },
  headerButton: {
    width: HEADER_BUTTON_SIZE,
    height: HEADER_BUTTON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: HEADER_BUTTON_BORDER_RADIUS,
    backgroundColor: COLORS.HEADER_BUTTON_BACKGROUND,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  content: {
    flex: 1,
    padding: CONTENT_PADDING,
  },
  section: {
    marginBottom: SECTION_MARGIN_BOTTOM,
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: SECTION_BORDER_RADIUS,
    padding: SECTION_PADDING,
    borderWidth: SECTION_BORDER_WIDTH,
    borderColor: COLORS.CARD_BORDER,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SECTION_HEADER_MARGIN_BOTTOM,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.WHITE,
    marginLeft: SECTION_TITLE_MARGIN_LEFT,
  },
  helpItem: {
    marginBottom: HELP_ITEM_MARGIN_BOTTOM,
    paddingLeft: HELP_ITEM_PADDING_LEFT,
  },
  helpItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.PRIMARY,
    marginBottom: HELP_ITEM_TITLE_MARGIN_BOTTOM,
  },
  helpItemDescription: {
    fontSize: 14,
    color: COLORS.ACCENT,
    lineHeight: ANSWER_LINE_HEIGHT,
  },
  supportSection: {
    alignItems: 'center',
    padding: SUPPORT_SECTION_PADDING,
    marginTop: SUPPORT_SECTION_MARGIN_TOP,
  },
  supportTitle: {
    fontSize: 16,
    color: COLORS.WHITE,
    marginBottom: SUPPORT_TITLE_MARGIN_BOTTOM,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SUPPORT_BUTTON_BACKGROUND,
    paddingHorizontal: SUPPORT_BUTTON_PADDING_HORIZONTAL,
    paddingVertical: SUPPORT_BUTTON_PADDING_VERTICAL,
    borderRadius: SUPPORT_BUTTON_BORDER_RADIUS,
    borderWidth: SUPPORT_BUTTON_BORDER_WIDTH,
    borderColor: COLORS.CARD_BORDER_STRONG,
    flex: 1,
  },
  supportButtonText: {
    color: COLORS.PRIMARY,
    fontSize: 16,
    marginLeft: SUPPORT_BUTTON_TEXT_MARGIN_LEFT,
  },
  welcomeSection: {
    alignItems: 'center',
    padding: WELCOME_SECTION_PADDING,
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: SECTION_BORDER_RADIUS,
    marginBottom: WELCOME_SECTION_MARGIN_BOTTOM,
    borderWidth: SECTION_BORDER_WIDTH,
    borderColor: COLORS.CARD_BORDER,
  },
  antoAvatar: {
    width: ANTO_AVATAR_SIZE,
    height: ANTO_AVATAR_SIZE,
    borderRadius: ANTO_AVATAR_BORDER_RADIUS,
    backgroundColor: COLORS.ANTO_AVATAR_BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: ANTO_AVATAR_MARGIN_BOTTOM,
    borderWidth: ANTO_AVATAR_BORDER_WIDTH,
    borderColor: COLORS.ANTO_AVATAR_BORDER,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: WELCOME_TITLE_MARGIN_BOTTOM,
  },
  welcomeText: {
    fontSize: 16,
    color: COLORS.ACCENT,
    textAlign: 'center',
    marginBottom: WELCOME_TEXT_MARGIN_BOTTOM,
    lineHeight: WELCOME_TEXT_LINE_HEIGHT,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: CHAT_BUTTON_PADDING_HORIZONTAL,
    paddingVertical: CHAT_BUTTON_PADDING_VERTICAL,
    borderRadius: CHAT_BUTTON_BORDER_RADIUS,
    marginTop: CHAT_BUTTON_MARGIN_TOP,
  },
  chatButtonText: {
    color: COLORS.CHAT_BUTTON_TEXT,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: CHAT_BUTTON_TEXT_MARGIN_LEFT,
  },
});

export default HelpScreen;
