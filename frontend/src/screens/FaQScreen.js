/**
 * Pantalla de Preguntas Frecuentes (FAQ)
 * 
 * Muestra preguntas y respuestas organizadas por categorías.
 * Incluye animaciones de expansión/colapso y opción para contactar con Anto.
 * 
 * @author AntoApp Team
 */

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  ImageBackground,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import ParticleBackground from '../components/ParticleBackground';
import { ROUTES } from '../constants/routes';
import { CHAT_BACK_TARGET } from '../navigation/navigationHelpers';
import { setChatEntryBackTarget } from '../utils/chatEntryContext';
import faqData from '../data/FaQScreen';
import { SPACING } from '../constants/ui';
import { useTheme } from '../context/ThemeContext';

// Constantes de textos
const TEXTS = {
  TITLE: 'Preguntas Frecuentes',
  INTRO: 'Aquí encontrarás respuestas a las preguntas más comunes sobre cómo usar la aplicación y aprovechar todas sus funciones.',
  CONTACT_TITLE: '¿No encontraste lo que buscabas?',
  CONTACT_SUBTITLE: 'Anto está aquí para ayudarte',
  CONTACT_BUTTON: 'Hablar con Anto',
  BACK: 'Volver',
};

// Constantes de estilos
const BACKGROUND_OPACITY = 0.1;
const HEADER_PADDING_HORIZONTAL = SPACING.SCREEN_EDGE_INSET;
const HEADER_PADDING_TOP = 50;
const HEADER_PADDING_BOTTOM = 20;
const BACK_BUTTON_PADDING = 8;
const HEADER_TITLE_MARGIN_LEFT = 12;
const SCROLL_VIEW_PADDING = SPACING.SCREEN_EDGE_INSET;
const IMAGE_CONTAINER_MARGIN_VERTICAL = 24;
const ANTO_IMAGE_SIZE = 120;
const ANTO_IMAGE_BORDER_RADIUS = 60;
const ANTO_IMAGE_SHADOW_RADIUS = 20;
const INTRO_TEXT_MARGIN_BOTTOM = 32;
const INTRO_TEXT_LINE_HEIGHT = 24;
const SECTION_MARGIN_BOTTOM = 32;
const SECTION_TITLE_MARGIN_BOTTOM = 20;
const SECTION_TITLE_PADDING_BOTTOM = 12;
const FAQ_ITEM_BORDER_RADIUS = 16;
const FAQ_ITEM_MARGIN_BOTTOM = 14;
const FAQ_ITEM_HEADER_PADDING = SPACING.SCREEN_EDGE_INSET;
const FAQ_ITEM_HEADER_PADDING_VERTICAL = 18;
const QUESTION_PADDING_RIGHT = 12;
const FAQ_ITEM_BODY_PADDING = SPACING.SCREEN_EDGE_INSET;
const FAQ_ITEM_BODY_PADDING_TOP = 0;
const ANSWER_LINE_HEIGHT = 22;
const CONTACT_SECTION_BORDER_RADIUS = 20;
const CONTACT_SECTION_PADDING = SPACING.SCREEN_EDGE_INSET;
const CONTACT_SECTION_MARGIN_TOP = 24;
const CONTACT_SECTION_MARGIN_BOTTOM = 32;
const CONTACT_TITLE_MARGIN_BOTTOM = 8;
const CONTACT_SUBTITLE_MARGIN_BOTTOM = 20;
const CONTACT_BUTTON_PADDING_VERTICAL = SPACING.SCREEN_EDGE_INSET;
const CONTACT_BUTTON_PADDING_HORIZONTAL = SPACING.SCREEN_EDGE_INSET * 2;
const CONTACT_BUTTON_BORDER_RADIUS = 30;
const BOTTOM_SPACE_HEIGHT = 100;
const ICON_SIZE = 26;
const CHEVRON_ICON_SIZE = 22;
const ANIMATION_DURATION = 300;

// Constantes de imágenes
const BACKGROUND_IMAGE = require('../images/back.png');
const ANTO_IMAGE = require('../images/Anto.png');

// Constantes de navegación
const CHAT_ROUTE = 'Chat';

// Constantes de animación
const CHEVRON_UP = 'chevron-up';
const CHEVRON_DOWN = 'chevron-down';

/**
 * Componente para cada pregunta y respuesta con animación moderna
 * 
 * @param {string} question - Texto de la pregunta
 * @param {string} answer - Texto de la respuesta
 */
const FaqItem = ({ question, answer, colors, styles }) => {
  const [expanded, setExpanded] = useState(false);
  const animatedOpacity = useRef(new Animated.Value(0)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0.95)).current;
  
  const toggleExpand = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    const toValue = expanded ? 0 : 1;
    
    Animated.parallel([
      Animated.timing(animatedOpacity, {
        toValue,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(rotateValue, {
        toValue,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.spring(scaleValue, {
        toValue: expanded ? 0.95 : 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
    
    setExpanded(!expanded);
  };
  
  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  
  return (
    <Animated.View 
      style={[
        styles.faqItemContainer,
        expanded && styles.faqItemContainerExpanded,
        {
          transform: [{ scale: scaleValue }],
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.faqItemHeader} 
        onPress={toggleExpand}
        activeOpacity={0.8}
      >
        <Text style={styles.question}>{question}</Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons 
            name={CHEVRON_DOWN} 
            size={CHEVRON_ICON_SIZE} 
            color={colors.primary} 
          />
        </Animated.View>
      </TouchableOpacity>
      
      {expanded && (
        <Animated.View 
          style={[
            styles.faqItemBody,
            {
              opacity: animatedOpacity,
            }
          ]}
        >
          <Text style={styles.answer}>{answer}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
};
const FaQScreen = () => {
  const navigation = useNavigation();
  const { colors, statusBarStyle } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
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
          backgroundColor: colors.chromeHeader,
          ...Platform.select({
            ios: {
              shadowColor: colors.glassShadow ?? colors.shadowAmbient,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
            },
            android: {
              elevation: 4,
            },
          }),
        },
        backButton: {
          padding: BACK_BUTTON_PADDING,
          borderRadius: 8,
        },
        headerTitle: {
          color: colors.text,
          fontSize: 22,
          fontWeight: '700',
          marginLeft: HEADER_TITLE_MARGIN_LEFT,
          letterSpacing: 0.5,
        },
        scrollView: {
          flex: 1,
        },
        scrollContent: {
          padding: SCROLL_VIEW_PADDING,
        },
        imageContainer: {
          alignItems: 'center',
          marginVertical: IMAGE_CONTAINER_MARGIN_VERTICAL,
        },
        antoImageWrapper: {
          width: ANTO_IMAGE_SIZE,
          height: ANTO_IMAGE_SIZE,
          borderRadius: ANTO_IMAGE_BORDER_RADIUS,
          backgroundColor: colors.primary,
          ...Platform.select({
            ios: {
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: ANTO_IMAGE_SHADOW_RADIUS,
            },
            android: {
              elevation: 8,
            },
          }),
          justifyContent: 'center',
          alignItems: 'center',
        },
        antoImage: {
          width: ANTO_IMAGE_SIZE - 8,
          height: ANTO_IMAGE_SIZE - 8,
          borderRadius: ANTO_IMAGE_BORDER_RADIUS - 4,
        },
        introText: {
          color: colors.textSecondary,
          fontSize: 17,
          textAlign: 'center',
          marginBottom: INTRO_TEXT_MARGIN_BOTTOM,
          lineHeight: INTRO_TEXT_LINE_HEIGHT,
          paddingHorizontal: 8,
        },
        section: {
          marginBottom: SECTION_MARGIN_BOTTOM,
        },
        sectionTitleContainer: {
          marginBottom: SECTION_TITLE_MARGIN_BOTTOM,
          paddingBottom: SECTION_TITLE_PADDING_BOTTOM,
          borderBottomWidth: 2,
          borderBottomColor: colors.chromeCardBorder,
          backgroundColor: colors.accentLineSoft,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingVertical: 8,
          borderRadius: 8,
        },
        sectionTitle: {
          color: colors.primary,
          fontSize: 20,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
        faqItemContainer: {
          backgroundColor: colors.chromeCard,
          borderRadius: FAQ_ITEM_BORDER_RADIUS,
          marginBottom: FAQ_ITEM_MARGIN_BOTTOM,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.chromeCardBorder,
          ...Platform.select({
            ios: {
              shadowColor: colors.glassShadow ?? colors.shadowAmbient,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            },
            android: {
              elevation: 2,
            },
          }),
        },
        faqItemContainerExpanded: {
          borderColor: colors.accentLine,
          ...Platform.select({
            ios: {
              shadowOpacity: 0.15,
              shadowRadius: 6,
            },
            android: {
              elevation: 4,
            },
          }),
        },
        faqItemHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: FAQ_ITEM_HEADER_PADDING,
          paddingVertical: FAQ_ITEM_HEADER_PADDING_VERTICAL,
        },
        question: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '600',
          flex: 1,
          paddingRight: QUESTION_PADDING_RIGHT,
          lineHeight: 22,
        },
        faqItemBody: {
          paddingHorizontal: FAQ_ITEM_BODY_PADDING,
          paddingBottom: FAQ_ITEM_BODY_PADDING,
          paddingTop: FAQ_ITEM_BODY_PADDING_TOP,
          backgroundColor: colors.glassFill,
          overflow: 'hidden',
        },
        answer: {
          color: colors.textSecondary,
          fontSize: 15,
          lineHeight: ANSWER_LINE_HEIGHT,
        },
        contactSection: {
          backgroundColor: colors.chromeCard,
          borderRadius: CONTACT_SECTION_BORDER_RADIUS,
          padding: CONTACT_SECTION_PADDING,
          alignItems: 'center',
          marginTop: CONTACT_SECTION_MARGIN_TOP,
          marginBottom: CONTACT_SECTION_MARGIN_BOTTOM,
          borderWidth: 2,
          borderColor: colors.accentLine,
          ...Platform.select({
            ios: {
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
            },
            android: {
              elevation: 6,
            },
          }),
        },
        contactIcon: {
          marginBottom: 12,
        },
        contactTitle: {
          color: colors.text,
          fontSize: 20,
          fontWeight: '700',
          marginBottom: CONTACT_TITLE_MARGIN_BOTTOM,
          textAlign: 'center',
        },
        contactSubtitle: {
          color: colors.textSecondary,
          fontSize: 15,
          marginBottom: CONTACT_SUBTITLE_MARGIN_BOTTOM,
          textAlign: 'center',
        },
        contactButton: {
          backgroundColor: colors.primary,
          paddingVertical: CONTACT_BUTTON_PADDING_VERTICAL,
          paddingHorizontal: CONTACT_BUTTON_PADDING_HORIZONTAL,
          borderRadius: CONTACT_BUTTON_BORDER_RADIUS,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          ...Platform.select({
            ios: {
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            },
            android: {
              elevation: 4,
            },
          }),
        },
        contactButtonText: {
          color: colors.textOnPrimary,
          fontSize: 17,
          fontWeight: '700',
          marginRight: 8,
        },
        contactButtonIcon: {
          marginLeft: 4,
        },
        bottomSpace: {
          height: BOTTOM_SPACE_HEIGHT,
        },
      }),
    [colors],
  );
  
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const handleChatNavigation = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert(
          'Iniciar sesión requerido',
          'Necesitas iniciar sesión para acceder al chat. ¿Deseas iniciar sesión ahora?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Iniciar sesión',
              onPress: () => navigation.navigate(ROUTES.SIGN_IN)
            }
          ]
        );
        return;
      }
      await setChatEntryBackTarget('dash');
      navigation.navigate('MainTabs', {
        screen: 'Chat',
        params: { chatBackTarget: CHAT_BACK_TARGET.DASH },
      });
    } catch (error) {
      console.error('[FaQScreen] Error verificando autenticación:', error);
      Alert.alert('Error', 'Hubo un problema al verificar tu sesión. Por favor, intenta iniciar sesión.');
    }
  };
  
  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={statusBarStyle} 
        backgroundColor={colors.background} 
        translucent
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
            onPress={() => {
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              navigation.goBack();
            }}
            accessibilityLabel={TEXTS.BACK}
          >
            <Ionicons 
              name="arrow-back" 
              size={ICON_SIZE} 
              color={colors.primary} 
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{TEXTS.TITLE}</Text>
        </View>
        
        {/* Contenido principal */}
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Imagen decorativa */}
            <View style={styles.imageContainer}>
              <View style={styles.antoImageWrapper}>
                <Image 
                  source={ANTO_IMAGE} 
                  style={styles.antoImage}
                  resizeMode="contain"
                />
              </View>
            </View>
            
            {/* Texto introductorio */}
            <Text style={styles.introText}>
              {TEXTS.INTRO}
            </Text>
            
            {/* Secciones de preguntas frecuentes */}
            {faqData.map((section, index) => (
              <View key={index} style={styles.section}>
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionTitle}>{section.category}</Text>
                </View>
                
                {section.items.map((item, itemIndex) => (
                  <FaqItem 
                    key={itemIndex}
                    question={item.question}
                    answer={item.answer}
                    colors={colors}
                    styles={styles}
                  />
                ))}
              </View>
            ))}
            
            {/* Sección de contacto */}
            <View style={styles.contactSection}>
              <Ionicons 
                name="chatbubble-ellipses" 
                size={32} 
                color={colors.primary} 
                style={styles.contactIcon}
              />
              <Text style={styles.contactTitle}>{TEXTS.CONTACT_TITLE}</Text>
              <Text style={styles.contactSubtitle}>{TEXTS.CONTACT_SUBTITLE}</Text>
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={handleChatNavigation}
                activeOpacity={0.8}
              >
                <Text style={styles.contactButtonText}>{TEXTS.CONTACT_BUTTON}</Text>
                <Ionicons 
                  name="arrow-forward" 
                  size={20} 
                  color={colors.textOnPrimary} 
                  style={styles.contactButtonIcon}
                />
              </TouchableOpacity>
            </View>
            
            {/* Espacio adicional al final */}
            <View style={styles.bottomSpace} />
          </Animated.View>
        </ScrollView>
      </ImageBackground>
    </View>
  );
};

export default FaQScreen;
