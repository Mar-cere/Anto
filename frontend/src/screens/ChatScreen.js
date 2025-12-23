/**
 * Pantalla de Chat
 * 
 * Permite a los usuarios interactuar con Anto, el asistente personal de IA.
 * Incluye envío y recepción de mensajes en tiempo real, indicador de escritura,
 * y opciones para limpiar la conversación. Integra Socket.IO para comunicación
 * en tiempo real.
 * 
 * @author AntoApp Team
 */

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import ParticleBackground from '../components/ParticleBackground';
import ActionSuggestionCard from '../components/ActionSuggestionCard';
import ProtocolProgressIndicator from '../components/ProtocolProgressIndicator';
import TrialBanner from '../components/TrialBanner';
import OfflineBanner from '../components/OfflineBanner';
import MarkdownText from '../components/MarkdownText';
import chatService from '../services/chatService';
import paymentService from '../services/paymentService';
import websocketService from '../services/websocketService';
import * as Notifications from 'expo-notifications';
import { colors } from '../styles/globalStyles';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const { width } = Dimensions.get('window');

// Constantes de textos
const TEXTS = {
  WELCOME: '¡Hola! Soy Anto, tu asistente personal. ¿En qué puedo ayudarte hoy?',
  PLACEHOLDER: 'Escribe un mensaje...',
  LOADING: 'Cargando conversación...',
  EMPTY: 'No hay mensajes aún',
  ERROR_LOAD: 'Error al cargar el chat',
  ERROR_SEND: 'Error al enviar el mensaje. Por favor, intenta de nuevo.',
  ERROR_COMMUNICATION: 'Error en la comunicación',
  ERROR_CLEAR: 'Error al borrar la conversación',
  MODAL_TITLE: 'Borrar conversación',
  MODAL_MESSAGE: '¿Estás seguro de que quieres borrar toda la conversación? Esta acción no se puede deshacer.',
  CANCEL: 'Cancelar',
  DELETE: 'Borrar',
  TITLE: 'Anto',
};

// Constantes de AsyncStorage
const STORAGE_KEYS = {
  CONVERSATION_ID: 'currentConversationId',
  TRIAL_BANNER_DISMISSED: 'trialBannerDismissed',
};

// Constantes de tipos de mensajes
const MESSAGE_TYPES = {
  TEXT: 'text',
  ERROR: 'error',
  WELCOME: 'welcome',
};

const MESSAGE_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
};

// Constantes de animación
const FADE_ANIMATION_DURATION = 500; // ms
const FADE_ANIMATION_TO_VALUE = 1;
const TYPING_ANIMATION_DURATION = 500; // ms
const TYPING_ANIMATION_TO_VALUE = 1;
const TYPING_ANIMATION_DELAYS = [0, 300, 600]; // ms
const TYPING_TRANSLATE_Y = -4;
const SCROLL_THRESHOLD = 100;

// Constantes de estilos
const BACKGROUND_OPACITY = 0.1;
const STATUS_BAR_STYLE = 'light-content';
const STATUS_BAR_BACKGROUND = 'transparent';
const CONTAINER_PADDING_TOP_IOS = 40;
const HEADER_PADDING_TOP_IOS = 30;
const HEADER_PADDING_TOP_ANDROID = 40;
const HEADER_PADDING_BOTTOM = 10;
const HEADER_PADDING_HORIZONTAL = 16;
const BACK_BUTTON_PADDING = 8;
const HEADER_AVATAR_SIZE = 30;
const HEADER_AVATAR_BORDER_RADIUS = 15;
const HEADER_AVATAR_MARGIN_RIGHT = 8;
const MENU_BUTTON_PADDING = 10;
const LOADING_TEXT_MARGIN_TOP = 16;
const MESSAGES_LIST_PADDING_HORIZONTAL = 14;
const MESSAGES_LIST_PADDING_TOP = 16;
const MESSAGES_LIST_PADDING_BOTTOM = 16;
const MESSAGE_CONTAINER_MARGIN_BOTTOM = 16;
const MESSAGE_BUBBLE_MAX_WIDTH = '80%';
const MESSAGE_BUBBLE_PADDING = 12;
const MESSAGE_BUBBLE_BORDER_RADIUS = 20;
const MESSAGE_BUBBLE_MARGIN_BOTTOM = 8;
const MESSAGE_BUBBLE_CORNER_RADIUS = 4;
const MESSAGE_AVATAR_SIZE = 30;
const MESSAGE_AVATAR_BORDER_RADIUS = 15;
const MESSAGE_AVATAR_MARGIN_RIGHT = 8;
const INPUT_CONTAINER_PADDING_HORIZONTAL = 16;
const INPUT_CONTAINER_PADDING_VERTICAL = 10;
const INPUT_CONTAINER_MARGIN_BOTTOM = 28;
const INPUT_BORDER_RADIUS = 20;
const INPUT_PADDING_HORIZONTAL = 16;
const INPUT_PADDING_VERTICAL = 10;
const INPUT_MAX_HEIGHT = 100;
const SEND_BUTTON_SIZE = 40;
const SEND_BUTTON_BORDER_RADIUS = 20;
const SEND_BUTTON_MARGIN_LEFT = 8;
const SCROLL_BUTTON_RIGHT = 16;
const SCROLL_BUTTON_BOTTOM = 80;
const SCROLL_BUTTON_SIZE = 40;
const SCROLL_BUTTON_BORDER_RADIUS = 20;
const SCROLL_BUTTON_BORDER_WIDTH = 1;
const MODAL_WIDTH_PERCENT = 0.8;
const MODAL_BORDER_RADIUS = 16;
const MODAL_PADDING = 24;
const MODAL_BORDER_WIDTH = 1;
const MODAL_TITLE_MARGIN_BOTTOM = 16;
const MODAL_TEXT_MARGIN_BOTTOM = 24;
const MODAL_BUTTON_PADDING_HORIZONTAL = 16;
const MODAL_BUTTON_PADDING_VERTICAL = 10;
const MODAL_BUTTON_BORDER_RADIUS = 8;
const MODAL_BUTTON_MARGIN_LEFT = 12;
const MODAL_BUTTON_BORDER_WIDTH = 1;
const TYPING_INDICATOR_PADDING_HORIZONTAL = 14;
const TYPING_INDICATOR_PADDING_BOTTOM = 8;
const TYPING_CONTAINER_MARGIN_BOTTOM = 8;
const TYPING_BUBBLE_MAX_WIDTH = '60%';
const TYPING_DOTS_CONTAINER_HEIGHT = 20;
const TYPING_DOT_SIZE = 6;
const TYPING_DOT_BORDER_RADIUS = 3;
const TYPING_DOT_MARGIN_HORIZONTAL = 2;
const EMPTY_CONTAINER_PADDING = 20;
const KEYBOARD_VERTICAL_OFFSET_IOS = 10;
const KEYBOARD_VERTICAL_OFFSET_ANDROID = 0;
const MAX_MESSAGE_LENGTH = 500;
const SCROLL_EVENT_THROTTLE = 16;

// Constantes de colores
const COLORS = {
  BACKGROUND: colors.background,
  PRIMARY: colors.primary,
  WHITE: colors.white,
  ACCENT: '#A3B8E8',
  ERROR: '#FF6464',
  HEADER_BACKGROUND: 'rgba(8, 16, 40, 0.3)',
  HEADER_BORDER: 'rgba(26, 221, 218, 0.3)',
  USER_BUBBLE: colors.primary,
  USER_TEXT: colors.background,
  BOT_BUBBLE: '#1D2B5F',
  BOT_TEXT: colors.white,
  INPUT_BACKGROUND: 'rgba(6, 12, 40, 0.3)',
  INPUT_BORDER: 'rgba(26, 221, 219, 0.3)',
  INPUT_FIELD_BACKGROUND: '#0F1A42',
  SEND_BUTTON_BACKGROUND: 'rgba(26, 221, 219, 0.2)',
  SEND_BUTTON_DISABLED_BACKGROUND: 'rgba(29, 43, 95, 0.5)',
  SCROLL_BUTTON_BACKGROUND: 'rgba(26, 221, 219, 0.2)',
  SCROLL_BUTTON_BORDER: colors.primary,
  MODAL_OVERLAY: 'rgba(3, 10, 36, 0.8)',
  MODAL_BACKGROUND: '#1D2B5F',
  MODAL_BORDER: 'rgba(26, 221, 219, 0.3)',
  MODAL_CANCEL_BACKGROUND: 'rgba(163, 184, 232, 0.2)',
  MODAL_CONFIRM_BACKGROUND: 'rgba(255, 100, 100, 0.2)',
  MODAL_CONFIRM_BORDER: 'rgba(255, 100, 100, 0.5)',
  ERROR_BUBBLE_BACKGROUND: 'rgba(255, 0, 0, 0.1)',
  ERROR_BUBBLE_BORDER: '#FF6464',
  TYPING_BUBBLE_BACKGROUND: '#1D2B5F',
  TYPING_DOT: colors.primary,
};

// Constantes de imágenes
const BACKGROUND_IMAGE = require('../images/back.png');
const ANTO_AVATAR = require('../images/Anto.png');

// Constantes de iconos
const ICON_SIZE_BACK = 24;
const ICON_SIZE_MENU = 20;
const ICON_SIZE_SEND = 20;
const ICON_SIZE_SCROLL = 24;

// Constantes de roles y tipos
const MESSAGE_ID_PREFIXES = {
  WELCOME: 'welcome',
  TEMP: 'temp',
  ERROR: 'error',
  MESSAGE: 'msg',
};

const ChatScreen = () => {
  // Estado de red
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOffline = !isConnected || isInternetReachable === false;

  // Estados
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [trialInfo, setTrialInfo] = useState(null);
  const [trialBannerDismissed, setTrialBannerDismissed] = useState(false);
  
  // Referencias
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Navegación
  const navigation = useNavigation();
  
  // Cargar información del trial
  const loadTrialInfo = useCallback(async () => {
    try {
      const trialInfoResult = await paymentService.getTrialInfo();
      if (trialInfoResult.success && trialInfoResult.isInTrial) {
        setTrialInfo(trialInfoResult);
      } else {
        setTrialInfo(null);
      }
    } catch (error) {
      console.error('[ChatScreen] Error cargando info de trial:', error);
      // No bloquear la carga si falla
      setTrialInfo(null);
    }
  }, []);

  // Manejar el dismiss del banner de trial
  const handleTrialBannerDismiss = useCallback(() => {
    setTrialBannerDismissed(true);
  }, []);

  // Inicializar chat
  const initializeConversation = useCallback(async () => {
    try {
      setIsLoading(true);
      
      await chatService.initializeSocket();
      const conversationId = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATION_ID);
      
      if (conversationId) {
        const serverMessages = await chatService.getMessages(conversationId);
        if (serverMessages && serverMessages.length > 0) {
          setMessages(serverMessages);
          return;
        }
      }

      // Si no hay mensajes, crear mensaje de bienvenida
      const welcomeMessage = {
        id: `${MESSAGE_ID_PREFIXES.WELCOME}-${Date.now()}`,
        content: TEXTS.WELCOME,
        role: MESSAGE_ROLES.ASSISTANT,
        type: MESSAGE_TYPES.TEXT,
        metadata: {
          timestamp: new Date().toISOString(),
          type: MESSAGE_TYPES.WELCOME
        }
      };
      
      setMessages([welcomeMessage]);
      await chatService.saveMessages([welcomeMessage]);
      
    } catch (error) {
      console.error('[ChatScreen] Error al inicializar chat:', error.message);
      setError(TEXTS.ERROR_LOAD);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Efecto inicial
  useEffect(() => {
    initializeConversation();
    loadTrialInfo();
    
    // Animación de entrada
    Animated.timing(fadeAnim, {
      toValue: FADE_ANIMATION_TO_VALUE,
      duration: FADE_ANIMATION_DURATION,
      useNativeDriver: true,
    }).start();

    // Configurar callbacks para mensajes y errores
    const messageUnsubscribe = chatService.onMessage((message) => {
      setMessages(prevMessages => {
        const newMessages = [...prevMessages, message];
        chatService.saveMessages(newMessages);
        return newMessages;
      });
    });

    const errorUnsubscribe = chatService.onError((error) => {
      console.error('[ChatScreen] Error en el chat:', error.message || error);
      setError(TEXTS.ERROR_COMMUNICATION);
    });

    return () => {
      messageUnsubscribe();
      errorUnsubscribe();
      chatService.closeSocket();
    };
  }, [initializeConversation, loadTrialInfo, fadeAnim]);

  // Conectar WebSocket y configurar listeners para alertas de emergencia
  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        // Obtener userId desde AsyncStorage
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const parsed = JSON.parse(userData);
          const userId = parsed._id || parsed.id;
          if (userId) {
            await websocketService.connect(userId);
          }
        }
      } catch (error) {
        console.error('[ChatScreen] Error conectando WebSocket:', error);
      }
    };

    connectWebSocket();

    // Listener para alertas de emergencia
    const unsubscribeAlert = websocketService.on('emergency:alert:sent', (data) => {
      console.log('[ChatScreen] Alerta de emergencia recibida en tiempo real:', data);
      
      // Mostrar notificación local
      if (data && !data.isTest) {
        Alert.alert(
          '🚨 Alerta de Emergencia Enviada',
          `Hemos notificado a ${data.successfulSends} de ${data.totalContacts} contacto(s) de emergencia.`,
          [{ text: 'OK' }]
        );
      }
    });

    // Listener para errores
    const unsubscribeError = websocketService.on('error', (error) => {
      console.error('[ChatScreen] Error en WebSocket:', error);
    });

    return () => {
      unsubscribeAlert();
      unsubscribeError();
      websocketService.disconnect();
    };
  }, []);

  // Scroll al final
  const scrollToBottom = useCallback((animated = true) => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated });
    }
  }, [messages.length]);

  // Manejar envío de mensajes
  const handleSend = useCallback(async () => {
    if (inputText.trim() === '') return;

    const messageText = inputText.trim();
    setInputText('');
    setIsTyping(true);

    const tempUserMessage = {
      id: `${MESSAGE_ID_PREFIXES.TEMP}-${Date.now()}`,
      content: messageText,
      role: MESSAGE_ROLES.USER,
      type: MESSAGE_TYPES.TEXT,
      metadata: {
        timestamp: new Date().toISOString(),
        pending: true
      }
    };

    try {
      // Mostrar mensaje del usuario inmediatamente
      setMessages(prev => [...prev, tempUserMessage]);
      scrollToBottom(true);

      const response = await chatService.sendMessage(messageText);
      
      if (response?.userMessage && response?.assistantMessage) {
        // Actualizar con los mensajes reales del servidor
        setMessages(prev => {
          const filtered = prev.filter(msg => msg.id !== tempUserMessage.id);
          const newMessages = [...filtered, response.userMessage, response.assistantMessage];
          
          // NUEVO: Agregar sugerencias de acciones si existen
          if (response.suggestions && response.suggestions.length > 0) {
            const suggestionsMessage = {
              id: `suggestions-${Date.now()}`,
              role: 'suggestions',
              type: 'suggestions',
              suggestions: response.suggestions,
              metadata: {
                timestamp: new Date().toISOString()
              }
            };
            newMessages.push(suggestionsMessage);
          }
          
          return newMessages;
        });
        scrollToBottom(true);
      }

    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      
      // Verificar si es un error de red/offline
      const isNetworkError = 
        error.message?.includes('Network request failed') ||
        error.message?.includes('network') ||
        error.message?.includes('ECONNREFUSED') ||
        error.message?.includes('timeout') ||
        !isConnected ||
        isOffline;
      
      if (isNetworkError) {
        // Remover el mensaje temporal del usuario
        setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
        
        const networkErrorMessage = {
          id: `${MESSAGE_ID_PREFIXES.ERROR}-${Date.now()}`,
          content: 'Sin conexión a internet. Por favor, verifica tu conexión e intenta nuevamente.',
          role: MESSAGE_ROLES.ASSISTANT,
          type: MESSAGE_TYPES.ERROR,
          metadata: {
            timestamp: new Date().toISOString(),
            error: true,
            networkError: true
          }
        };

        setMessages(prev => [...prev, networkErrorMessage]);
        scrollToBottom(true);
        return;
      }
      
      // Verificar si es un error de suscripción (debe ser el primero para capturar todos los casos)
      const isSubscriptionError = 
        error.message?.includes('suscripción') || 
        error.message?.includes('subscription') || 
        error.message?.includes('trial') ||
        error.message?.includes('Se requiere suscripción activa') ||
        (error.response?.status === 403 && error.response?.data?.requiresSubscription);
      
      if (isSubscriptionError) {
        // Remover el mensaje temporal del usuario
        setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
        
        // Obtener el mensaje del error, priorizando el del servidor
        const errorMessage = error.response?.data?.message || 
                           error.message || 
                           'Necesitas una suscripción activa para usar el chat. Tu período de prueba ha expirado.';
        
        // Mostrar alerta y redirigir a suscripción
        Alert.alert(
          'Suscripción requerida',
          errorMessage,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Ver planes',
              onPress: () => {
                navigation.navigate('Subscription');
              }
            }
          ]
        );
        return;
      }
      
      // Verificar si es un error relacionado con la creación de conversación (pero no de suscripción)
      if (error.message?.includes('No se pudo crear') || 
          (error.message?.includes('conversación') && !isSubscriptionError)) {
        // Remover el mensaje temporal del usuario
        setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
        
        const conversationErrorMessage = {
          id: `${MESSAGE_ID_PREFIXES.ERROR}-${Date.now()}`,
          content: 'Hubo un problema al iniciar la conversación. Por favor, intenta de nuevo.',
          role: MESSAGE_ROLES.ASSISTANT,
          type: MESSAGE_TYPES.ERROR,
          metadata: {
            timestamp: new Date().toISOString(),
            error: true
          }
        };

        setMessages(prev => [...prev, conversationErrorMessage]);
        scrollToBottom(true);
        return;
      }
      
      const errorMessage = {
        id: `${MESSAGE_ID_PREFIXES.ERROR}-${Date.now()}`,
        content: TEXTS.ERROR_SEND,
        role: MESSAGE_ROLES.ASSISTANT,
        type: MESSAGE_TYPES.ERROR,
        metadata: {
          timestamp: new Date().toISOString(),
          error: true
        }
      };

      setMessages(prev => [...prev, errorMessage]);
      scrollToBottom(true);
    } finally {
      setIsTyping(false);
    }
  }, [inputText, scrollToBottom]);

  // Limpiar conversación
  const clearConversation = useCallback(async () => {
    try {
      await chatService.clearMessages();
      await initializeConversation();
      setShowClearModal(false);
      
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.log('Haptics error:', error);
      }
    } catch (error) {
      console.error('Error al borrar la conversación:', error);
      setError(TEXTS.ERROR_CLEAR);
    }
  }, [initializeConversation]);

  // Función para recargar mensajes
  const refreshMessages = useCallback(async () => {
    try {
      setRefreshing(true);
      const conversationId = await AsyncStorage.getItem(STORAGE_KEYS.CONVERSATION_ID);
      if (conversationId) {
        const serverMessages = await chatService.getMessages(conversationId);
        if (serverMessages && serverMessages.length > 0) {
          setMessages(serverMessages);
        }
      }
    } catch (error) {
      console.error('[ChatScreen] Error al recargar mensajes:', error.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Renderizar mensaje
  const renderMessage = useCallback(({ item }) => {
    // Si el item es un objeto de respuesta, extraer el mensaje correcto
    const message = item.userMessage || item.assistantMessage || item;
    const isUser = message.role === MESSAGE_ROLES.USER;
    
    // NUEVO: Renderizar sugerencias de acciones
    if (message.type === 'suggestions' && message.suggestions) {
      return (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>💡 Sugerencias para ti:</Text>
          {message.suggestions.map((suggestion, index) => (
            <ActionSuggestionCard
              key={suggestion.id || index}
              suggestion={suggestion}
              onPress={(suggestion) => {
                // Navegar a la pantalla correspondiente
                if (suggestion.screen) {
                  try {
                    navigation.navigate(suggestion.screen);
                  } catch (error) {
                    console.warn('Error navegando a pantalla:', suggestion.screen, error);
                    // Si falla la navegación, enviar mensaje como fallback
                    setInputText(`Quiero probar: ${suggestion.label}`);
                  }
                } else {
                  // Si no hay pantalla específica, enviar un mensaje sobre la sugerencia
                  setInputText(`Quiero probar: ${suggestion.label}`);
                }
              }}
              onDismiss={() => {
                // Remover la sugerencia de la lista
                setMessages(prev => prev.filter((msg, i) => {
                  if (msg.type === 'suggestions' && msg.suggestions) {
                    const updatedSuggestions = msg.suggestions.filter((s, idx) => idx !== index);
                    if (updatedSuggestions.length === 0) {
                      return false; // Remover el mensaje completo si no quedan sugerencias
                    }
                    return true;
                  }
                  return true;
                }));
              }}
            />
          ))}
        </View>
      );
    }
    
    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.botMessageContainer
      ]}>
        {!isUser && (
          <Image 
            source={ANTO_AVATAR} 
            style={styles.messageAvatar}
          />
        )}
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.botBubble,
          message.type === MESSAGE_TYPES.ERROR && styles.errorBubble
        ]}>
          <MarkdownText
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.botMessageText,
              message.type === MESSAGE_TYPES.ERROR && styles.errorText
            ]}
            boldStyle={[
              styles.messageTextBold,
              isUser ? styles.userMessageTextBold : styles.botMessageTextBold
            ]}
          >
            {message.content}
          </MarkdownText>
        </View>
      </View>
    );
  }, [navigation]);

  // Manejar scroll
  const handleScroll = useCallback((event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const scrollViewHeight = event.nativeEvent.layoutMeasurement.height;
    
    setShowScrollButton(contentHeight - offsetY - scrollViewHeight > SCROLL_THRESHOLD);
  }, []);

  // Componente de indicador de escritura
  const TypingIndicator = useCallback(() => {
    if (!isTyping) return null;

    // Componente interno para cada punto animado
    const TypingDot = ({ delay }) => {
      const animation = useRef(new Animated.Value(0)).current;

      useEffect(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(animation, {
              toValue: TYPING_ANIMATION_TO_VALUE,
              duration: TYPING_ANIMATION_DURATION,
              delay,
              useNativeDriver: true,
            }),
            Animated.timing(animation, {
              toValue: 0,
              duration: TYPING_ANIMATION_DURATION,
              useNativeDriver: true,
            }),
          ])
        ).start();

        return () => animation.stopAnimation();
      }, [animation, delay]);

      return (
        <Animated.View
          style={[
            styles.typingDot,
            {
              opacity: animation,
              transform: [{
                translateY: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, TYPING_TRANSLATE_Y],
                }),
              }],
            },
          ]}
        />
      );
    };

    return (
      <View style={styles.typingContainer}>
        <Image 
          source={ANTO_AVATAR} 
          style={styles.typingAvatar} 
        />
        <View style={styles.typingBubble}>
          <View style={styles.typingDotsContainer}>
            {TYPING_ANIMATION_DELAYS.map((delay, index) => (
              <TypingDot key={index} delay={delay} />
            ))}
          </View>
        </View>
      </View>
    );
  }, [isTyping]);

  // Verificar autenticación al montar
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          // Si no hay token, redirigir a SignIn
          navigation.reset({
            index: 0,
            routes: [{ name: 'SignIn' }],
          });
          return;
        }
      } catch (error) {
        console.error('[ChatScreen] Error verificando autenticación:', error);
        navigation.reset({
          index: 0,
          routes: [{ name: 'SignIn' }],
        });
      }
    };
    
    checkAuthentication();
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      // Recargar info de trial cuando la pantalla recibe foco
      loadTrialInfo();
      // Al entrar, puedes cargar mensajes
      return () => {
        // Al salir, limpia los mensajes
        setMessages([]);
      };
    }, [loadTrialInfo])
  );

  return (
    <View style={styles.container}>
      <Image 
        source={BACKGROUND_IMAGE} 
        style={styles.backgroundImage} 
        resizeMode="cover"
      />
      <ParticleBackground />
      
      <StatusBar 
        translucent 
        backgroundColor={STATUS_BAR_BACKGROUND} 
        barStyle={STATUS_BAR_STYLE} 
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={async () => {
            try {
              // Verificar autenticación antes de volver
              const token = await AsyncStorage.getItem('userToken');
              
              if (!token) {
                // Si no hay token, ir a Home
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Home' }],
                });
                return;
              }
              
              // Si hay token, verificar si puede volver
              if (navigation.canGoBack()) {
                // Verificar si estamos dentro del TabNavigator
                const parent = navigation.getParent();
                if (parent) {
                  const parentState = parent.getState();
                  const parentRoutes = parentState?.routes || [];
                  
                  // Si la ruta anterior en el stack es Home, volver a Home
                  if (parentRoutes.length > 1) {
                    const previousRoute = parentRoutes[parentRoutes.length - 2];
                    if (previousRoute?.name === 'Home') {
                      parent.navigate('Home');
                      return;
                    }
                  }
                }
                
                // Si no viene de Home, hacer goBack normal
                navigation.goBack();
              } else {
                // Si no puede volver, ir a Home
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Home' }],
                });
              }
            } catch (error) {
              console.error('[ChatScreen] Error en goBack:', error);
              // En caso de error, ir a Home
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            }
          }}
        >
          <Ionicons name="arrow-back" size={ICON_SIZE_BACK} color={COLORS.PRIMARY} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Image 
            source={ANTO_AVATAR} 
            style={styles.headerAvatar} 
          />
          <Text style={styles.headerTitle}>{TEXTS.TITLE}</Text>
        </View>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setShowClearModal(true)}
        >
          <Ionicons name="ellipsis-vertical" size={ICON_SIZE_MENU} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>
      
      {/* Offline Banner */}
      <OfflineBanner />
      
      {/* Trial Banner */}
      {trialInfo && trialInfo.isInTrial && !trialBannerDismissed && (
        <TrialBanner
          daysRemaining={trialInfo.daysRemaining}
          onDismiss={handleTrialBannerDismiss}
          dismissed={trialBannerDismissed}
        />
      )}

      {/* Chat Container */}
      <Animated.View style={[styles.chatContainer, { opacity: fadeAnim }]}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            <Text style={styles.loadingText}>{TEXTS.LOADING}</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => {
              const message = item.userMessage || item.assistantMessage || item;
              return message._id || message.id || `${MESSAGE_ID_PREFIXES.MESSAGE}-${Date.now()}-${Math.random()}`;
            }}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => scrollToBottom(false)}
            onLayout={() => scrollToBottom(false)}
            onScroll={handleScroll}
            scrollEventThrottle={SCROLL_EVENT_THROTTLE}
            refreshing={refreshing}
            onRefresh={refreshMessages}
            inverted={false}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{TEXTS.EMPTY}</Text>
              </View>
            )}
            ListFooterComponent={TypingIndicator}
            ListFooterComponentStyle={styles.typingIndicatorContainer}
          />
        )}
      </Animated.View>
      
      {/* Input Container */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? KEYBOARD_VERTICAL_OFFSET_IOS : KEYBOARD_VERTICAL_OFFSET_ANDROID}
        style={styles.inputContainer}
      >
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={TEXTS.PLACEHOLDER}
          placeholderTextColor={COLORS.ACCENT}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={MAX_MESSAGE_LENGTH}
        />
        <TouchableOpacity 
          style={[
            styles.sendButton,
            inputText.trim() === '' ? styles.sendButtonDisabled : {}
          ]}
          onPress={handleSend}
          disabled={inputText.trim() === ''}
        >
          <Ionicons 
            name="send" 
            size={ICON_SIZE_SEND} 
            color={inputText.trim() === '' ? COLORS.ACCENT : COLORS.PRIMARY} 
          />
        </TouchableOpacity>
      </KeyboardAvoidingView>
      
      {/* Scroll To Bottom Button */}
      {showScrollButton && (
        <TouchableOpacity 
          style={styles.scrollToBottomButton}
          onPress={() => scrollToBottom()}
        >
          <Ionicons name="chevron-down" size={ICON_SIZE_SCROLL} color={COLORS.WHITE} />
        </TouchableOpacity>
      )}
      
      {/* Clear Chat Modal */}
      {showClearModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{TEXTS.MODAL_TITLE}</Text>
            <Text style={styles.modalText}>
              {TEXTS.MODAL_MESSAGE}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowClearModal(false)}
              >
                <Text style={styles.modalButtonText}>{TEXTS.CANCEL}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={clearConversation}
              >
                <Text style={[styles.modalButtonText, styles.modalConfirmButtonText]}>
                  {TEXTS.DELETE}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    paddingTop: Platform.OS === 'ios' ? CONTAINER_PADDING_TOP_IOS : 0,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: BACKGROUND_OPACITY,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? HEADER_PADDING_TOP_IOS : HEADER_PADDING_TOP_ANDROID,
    paddingBottom: HEADER_PADDING_BOTTOM,
    paddingHorizontal: HEADER_PADDING_HORIZONTAL,
    backgroundColor: COLORS.HEADER_BACKGROUND,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.HEADER_BORDER,
  },
  backButton: {
    padding: BACK_BUTTON_PADDING,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerAvatar: {
    width: HEADER_AVATAR_SIZE,
    height: HEADER_AVATAR_SIZE,
    borderRadius: HEADER_AVATAR_BORDER_RADIUS,
    marginRight: HEADER_AVATAR_MARGIN_RIGHT,
  },
  menuButton: {
    padding: MENU_BUTTON_PADDING,
  },
  chatContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.ACCENT,
    marginTop: LOADING_TEXT_MARGIN_TOP,
    fontSize: 16,
  },
  messagesList: {
    paddingHorizontal: MESSAGES_LIST_PADDING_HORIZONTAL,
    paddingTop: MESSAGES_LIST_PADDING_TOP,
    paddingBottom: MESSAGES_LIST_PADDING_BOTTOM,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: MESSAGE_CONTAINER_MARGIN_BOTTOM,
    maxWidth: '100%',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: MESSAGE_BUBBLE_MAX_WIDTH,
    padding: MESSAGE_BUBBLE_PADDING,
    borderRadius: MESSAGE_BUBBLE_BORDER_RADIUS,
    marginBottom: MESSAGE_BUBBLE_MARGIN_BOTTOM,
  },
  userBubble: {
    backgroundColor: COLORS.USER_BUBBLE,
    borderBottomRightRadius: MESSAGE_BUBBLE_CORNER_RADIUS,
    marginLeft: 'auto',
  },
  botBubble: {
    backgroundColor: COLORS.BOT_BUBBLE,
    borderBottomLeftRadius: MESSAGE_BUBBLE_CORNER_RADIUS,
    marginRight: 'auto',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: COLORS.USER_TEXT,
  },
  botMessageText: {
    color: COLORS.BOT_TEXT,
  },
  messageTextBold: {
    fontWeight: 'bold',
  },
  userMessageTextBold: {
    fontWeight: 'bold',
    color: COLORS.USER_TEXT,
  },
  botMessageTextBold: {
    fontWeight: 'bold',
    color: COLORS.BOT_TEXT,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: INPUT_CONTAINER_PADDING_HORIZONTAL,
    paddingVertical: INPUT_CONTAINER_PADDING_VERTICAL,
    backgroundColor: COLORS.INPUT_BACKGROUND,
    borderTopWidth: 1,
    borderTopColor: COLORS.INPUT_BORDER,
    marginBottom: INPUT_CONTAINER_MARGIN_BOTTOM,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.INPUT_FIELD_BACKGROUND,
    borderRadius: INPUT_BORDER_RADIUS,
    paddingHorizontal: INPUT_PADDING_HORIZONTAL,
    paddingVertical: INPUT_PADDING_VERTICAL,
    color: COLORS.WHITE,
    maxHeight: INPUT_MAX_HEIGHT,
    fontSize: 16,
  },
  sendButton: {
    width: SEND_BUTTON_SIZE,
    height: SEND_BUTTON_SIZE,
    borderRadius: SEND_BUTTON_BORDER_RADIUS,
    backgroundColor: COLORS.SEND_BUTTON_BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SEND_BUTTON_MARGIN_LEFT,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.SEND_BUTTON_DISABLED_BACKGROUND,
  },
  scrollToBottomButton: {
    position: 'absolute',
    right: SCROLL_BUTTON_RIGHT,
    bottom: SCROLL_BUTTON_BOTTOM,
    width: SCROLL_BUTTON_SIZE,
    height: SCROLL_BUTTON_SIZE,
    borderRadius: SCROLL_BUTTON_BORDER_RADIUS,
    backgroundColor: COLORS.SCROLL_BUTTON_BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: SCROLL_BUTTON_BORDER_WIDTH,
    borderColor: COLORS.SCROLL_BUTTON_BORDER,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.MODAL_OVERLAY,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    width: width * MODAL_WIDTH_PERCENT,
    backgroundColor: COLORS.MODAL_BACKGROUND,
    borderRadius: MODAL_BORDER_RADIUS,
    padding: MODAL_PADDING,
    borderWidth: MODAL_BORDER_WIDTH,
    borderColor: COLORS.MODAL_BORDER,
  },
  modalTitle: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: MODAL_TITLE_MARGIN_BOTTOM,
  },
  modalText: {
    color: COLORS.ACCENT,
    fontSize: 16,
    marginBottom: MODAL_TEXT_MARGIN_BOTTOM,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: MODAL_BUTTON_PADDING_HORIZONTAL,
    paddingVertical: MODAL_BUTTON_PADDING_VERTICAL,
    borderRadius: MODAL_BUTTON_BORDER_RADIUS,
    marginLeft: MODAL_BUTTON_MARGIN_LEFT,
  },
  modalCancelButton: {
    backgroundColor: COLORS.MODAL_CANCEL_BACKGROUND,
  },
  modalConfirmButton: {
    backgroundColor: COLORS.MODAL_CONFIRM_BACKGROUND,
    borderWidth: MODAL_BUTTON_BORDER_WIDTH,
    borderColor: COLORS.MODAL_CONFIRM_BORDER,
  },
  modalButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalConfirmButtonText: {
    color: COLORS.ERROR,
  },
  messageAvatar: {
    width: MESSAGE_AVATAR_SIZE,
    height: MESSAGE_AVATAR_SIZE,
    borderRadius: MESSAGE_AVATAR_BORDER_RADIUS,
    marginRight: MESSAGE_AVATAR_MARGIN_RIGHT,
    alignSelf: 'flex-end',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: EMPTY_CONTAINER_PADDING,
  },
  emptyText: {
    color: COLORS.ACCENT,
    fontSize: 16,
  },
  errorBubble: {
    backgroundColor: COLORS.ERROR_BUBBLE_BACKGROUND,
    borderColor: COLORS.ERROR_BUBBLE_BORDER,
    borderWidth: MODAL_BUTTON_BORDER_WIDTH,
  },
  suggestionsContainer: {
    marginBottom: 16,
    paddingHorizontal: 14,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: 8,
  },
  errorText: {
    color: COLORS.ERROR,
  },
  typingIndicatorContainer: {
    paddingHorizontal: TYPING_INDICATOR_PADDING_HORIZONTAL,
    paddingBottom: TYPING_INDICATOR_PADDING_BOTTOM,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: TYPING_CONTAINER_MARGIN_BOTTOM,
  },
  typingAvatar: {
    width: MESSAGE_AVATAR_SIZE,
    height: MESSAGE_AVATAR_SIZE,
    borderRadius: MESSAGE_AVATAR_BORDER_RADIUS,
    marginRight: MESSAGE_AVATAR_MARGIN_RIGHT,
  },
  typingBubble: {
    backgroundColor: COLORS.TYPING_BUBBLE_BACKGROUND,
    borderRadius: MESSAGE_BUBBLE_BORDER_RADIUS,
    borderBottomLeftRadius: MESSAGE_BUBBLE_CORNER_RADIUS,
    padding: MESSAGE_BUBBLE_PADDING,
    maxWidth: TYPING_BUBBLE_MAX_WIDTH,
  },
  typingDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: TYPING_DOTS_CONTAINER_HEIGHT,
  },
  typingDot: {
    width: TYPING_DOT_SIZE,
    height: TYPING_DOT_SIZE,
    borderRadius: TYPING_DOT_BORDER_RADIUS,
    backgroundColor: COLORS.TYPING_DOT,
    marginHorizontal: TYPING_DOT_MARGIN_HORIZONTAL,
  },
});

export default ChatScreen;