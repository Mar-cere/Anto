/**
 * Pantalla de Preguntas Frecuentes (FAQ)
 * 
 * Muestra preguntas y respuestas organizadas por categorías.
 * Incluye animaciones de expansión/colapso y opción para contactar con Anto.
 * 
 * @author AntoApp Team
 */

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  Image,
  ImageBackground,
  LayoutAnimation,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';
import ParticleBackground from '../components/ParticleBackground';
import faqData from '../data/FaQScreen';
import { colors } from '../styles/globalStyles';

// Constantes de textos
const TEXTS = {
  TITLE: 'Preguntas Frecuentes',
  INTRO: 'Aquí encontrarás respuestas a las preguntas más comunes sobre cómo usar la aplicación y aprovechar todas sus funciones.',
  CONTACT_TITLE: '¿No encontraste lo que buscabas?',
  CONTACT_BUTTON: 'Hablar con Anto',
  BACK: 'Volver',
};

// Constantes de estilos
const BACKGROUND_OPACITY = 0.1;
const STATUS_BAR_STYLE = 'light-content';
const STATUS_BAR_BACKGROUND = '#030A24';
const HEADER_PADDING_HORIZONTAL = 16;
const HEADER_PADDING_TOP = 50;
const HEADER_PADDING_BOTTOM = 16;
const HEADER_BORDER_WIDTH = 1;
const BACK_BUTTON_PADDING = 8;
const HEADER_TITLE_MARGIN_LEFT = 8;
const SCROLL_VIEW_PADDING = 16;
const IMAGE_CONTAINER_MARGIN_VERTICAL = 20;
const ANTO_IMAGE_SIZE = 100;
const ANTO_IMAGE_BORDER_RADIUS = 50;
const INTRO_TEXT_MARGIN_BOTTOM = 24;
const INTRO_TEXT_LINE_HEIGHT = 22;
const SECTION_MARGIN_BOTTOM = 24;
const SECTION_TITLE_MARGIN_BOTTOM = 16;
const SECTION_TITLE_BORDER_WIDTH = 1;
const SECTION_TITLE_PADDING_BOTTOM = 8;
const FAQ_ITEM_BORDER_RADIUS = 10;
const FAQ_ITEM_MARGIN_BOTTOM = 12;
const FAQ_ITEM_BORDER_WIDTH = 1;
const FAQ_ITEM_HEADER_PADDING = 16;
const FAQ_ITEM_ACTIVE_OPACITY = 0.7;
const QUESTION_PADDING_RIGHT = 8;
const FAQ_ITEM_BODY_PADDING = 16;
const FAQ_ITEM_BODY_PADDING_TOP = 0;
const ANSWER_LINE_HEIGHT = 20;
const CONTACT_SECTION_BORDER_RADIUS = 10;
const CONTACT_SECTION_PADDING = 20;
const CONTACT_SECTION_MARGIN_TOP = 16;
const CONTACT_SECTION_MARGIN_BOTTOM = 24;
const CONTACT_SECTION_BORDER_WIDTH = 1;
const CONTACT_TITLE_MARGIN_BOTTOM = 16;
const CONTACT_BUTTON_PADDING_VERTICAL = 12;
const CONTACT_BUTTON_PADDING_HORIZONTAL = 24;
const CONTACT_BUTTON_BORDER_RADIUS = 25;
const BOTTOM_SPACE_HEIGHT = 100;
const ICON_SIZE = 24;
const CHEVRON_ICON_SIZE = 20;

// Constantes de colores
const COLORS = {
  BACKGROUND: colors.background,
  PRIMARY: colors.primary,
  WHITE: colors.white,
  ACCENT: '#A3B8E8',
  HEADER_BACKGROUND: '#1D2B5F',
  HEADER_BORDER: 'rgba(26, 221, 219, 0.3)',
  CARD_BACKGROUND: '#1D2B5F',
  CARD_BORDER: 'rgba(26, 221, 219, 0.2)',
  CARD_BORDER_STRONG: 'rgba(26, 221, 219, 0.3)',
  FAQ_ITEM_BODY_BACKGROUND: 'rgba(29, 43, 95, 0.5)',
  CONTACT_BUTTON_TEXT: colors.background,
};

// Constantes de imágenes
const BACKGROUND_IMAGE = require('../images/back.png');
const ANTO_IMAGE = require('../images/Anto.png');

// Constantes de navegación
const CHAT_ROUTE = 'Chat';

// Constantes de animación
const LAYOUT_ANIMATION_PRESET = LayoutAnimation.Presets.easeInEaseOut;
const CHEVRON_UP = 'chevron-up';
const CHEVRON_DOWN = 'chevron-down';

// Habilitar LayoutAnimation para Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Componente para cada pregunta y respuesta con animación
 * 
 * @param {string} question - Texto de la pregunta
 * @param {string} answer - Texto de la respuesta
 */
const FaqItem = ({ question, answer }) => {
  const [expanded, setExpanded] = useState(false);
  
  const toggleExpand = () => {
    LayoutAnimation.configureNext(LAYOUT_ANIMATION_PRESET);
    setExpanded(!expanded);
  };
  
  return (
    <View style={styles.faqItemContainer}>
      <TouchableOpacity 
        style={styles.faqItemHeader} 
        onPress={toggleExpand}
        activeOpacity={FAQ_ITEM_ACTIVE_OPACITY}
      >
        <Text style={styles.question}>{question}</Text>
        <Ionicons 
          name={expanded ? CHEVRON_UP : CHEVRON_DOWN} 
          size={CHEVRON_ICON_SIZE} 
          color={COLORS.PRIMARY} 
        />
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.faqItemBody}>
          <Text style={styles.answer}>{answer}</Text>
        </View>
      )}
    </View>
  );
};
const FaQScreen = () => {
  const navigation = useNavigation();
  
  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={STATUS_BAR_STYLE} 
        backgroundColor={STATUS_BAR_BACKGROUND} 
      />
      <ImageBackground
        source={BACKGROUND_IMAGE}
        style={styles.background}
        imageStyle={styles.imageStyle}
      >
        <ParticleBackground />
        
        {/* Encabezado */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel={TEXTS.BACK}
          >
            <Ionicons 
              name="arrow-back" 
              size={ICON_SIZE} 
              color={COLORS.PRIMARY} 
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{TEXTS.TITLE}</Text>
        </View>
        
        {/* Contenido principal */}
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Imagen decorativa */}
          <View style={styles.imageContainer}>
            <Image 
              source={ANTO_IMAGE} 
              style={styles.antoImage}
              resizeMode="contain"
            />
          </View>
          
          {/* Texto introductorio */}
          <Text style={styles.introText}>
            {TEXTS.INTRO}
          </Text>
          
          {/* Secciones de preguntas frecuentes */}
          {faqData.map((section, index) => (
            <View key={index} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.category}</Text>
              
              {section.items.map((item, itemIndex) => (
                <FaqItem 
                  key={itemIndex}
                  question={item.question}
                  answer={item.answer}
                />
              ))}
            </View>
          ))}
          
          {/* Sección de contacto */}
          <View style={styles.contactSection}>
            <Text style={styles.contactTitle}>{TEXTS.CONTACT_TITLE}</Text>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={() => navigation.navigate(CHAT_ROUTE)}
            >
              <Text style={styles.contactButtonText}>{TEXTS.CONTACT_BUTTON}</Text>
            </TouchableOpacity>
          </View>
          
          {/* Espacio adicional al final */}
          <View style={styles.bottomSpace} />
        </ScrollView>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  background: {
    flex: 1,
    width: '100%',
  },
  imageStyle: {
    opacity: BACKGROUND_OPACITY,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: HEADER_PADDING_HORIZONTAL,
    paddingTop: HEADER_PADDING_TOP,
    paddingBottom: HEADER_PADDING_BOTTOM,
    backgroundColor: COLORS.HEADER_BACKGROUND,
    borderBottomWidth: HEADER_BORDER_WIDTH,
    borderBottomColor: COLORS.HEADER_BORDER,
  },
  backButton: {
    padding: BACK_BUTTON_PADDING,
  },
  headerTitle: {
    color: COLORS.WHITE,
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: HEADER_TITLE_MARGIN_LEFT,
  },
  scrollView: {
    flex: 1,
    padding: SCROLL_VIEW_PADDING,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: IMAGE_CONTAINER_MARGIN_VERTICAL,
  },
  antoImage: {
    width: ANTO_IMAGE_SIZE,
    height: ANTO_IMAGE_SIZE,
    borderRadius: ANTO_IMAGE_BORDER_RADIUS,
    backgroundColor: COLORS.PRIMARY,
  },
  introText: {
    color: COLORS.ACCENT,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: INTRO_TEXT_MARGIN_BOTTOM,
    lineHeight: INTRO_TEXT_LINE_HEIGHT,
  },
  section: {
    marginBottom: SECTION_MARGIN_BOTTOM,
  },
  sectionTitle: {
    color: COLORS.PRIMARY,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SECTION_TITLE_MARGIN_BOTTOM,
    borderBottomWidth: SECTION_TITLE_BORDER_WIDTH,
    borderBottomColor: COLORS.HEADER_BORDER,
    paddingBottom: SECTION_TITLE_PADDING_BOTTOM,
  },
  faqItemContainer: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: FAQ_ITEM_BORDER_RADIUS,
    marginBottom: FAQ_ITEM_MARGIN_BOTTOM,
    overflow: 'hidden',
    borderWidth: FAQ_ITEM_BORDER_WIDTH,
    borderColor: COLORS.CARD_BORDER,
  },
  faqItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: FAQ_ITEM_HEADER_PADDING,
  },
  question: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    paddingRight: QUESTION_PADDING_RIGHT,
  },
  faqItemBody: {
    padding: FAQ_ITEM_BODY_PADDING,
    paddingTop: FAQ_ITEM_BODY_PADDING_TOP,
    backgroundColor: COLORS.FAQ_ITEM_BODY_BACKGROUND,
  },
  answer: {
    color: COLORS.ACCENT,
    fontSize: 14,
    lineHeight: ANSWER_LINE_HEIGHT,
  },
  contactSection: {
    backgroundColor: COLORS.CARD_BACKGROUND,
    borderRadius: CONTACT_SECTION_BORDER_RADIUS,
    padding: CONTACT_SECTION_PADDING,
    alignItems: 'center',
    marginTop: CONTACT_SECTION_MARGIN_TOP,
    marginBottom: CONTACT_SECTION_MARGIN_BOTTOM,
    borderWidth: CONTACT_SECTION_BORDER_WIDTH,
    borderColor: COLORS.CARD_BORDER_STRONG,
  },
  contactTitle: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: CONTACT_TITLE_MARGIN_BOTTOM,
  },
  contactButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: CONTACT_BUTTON_PADDING_VERTICAL,
    paddingHorizontal: CONTACT_BUTTON_PADDING_HORIZONTAL,
    borderRadius: CONTACT_BUTTON_BORDER_RADIUS,
  },
  contactButtonText: {
    color: COLORS.CONTACT_BUTTON_TEXT,
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpace: {
    height: BOTTOM_SPACE_HEIGHT,
  },
});

export default FaQScreen;
