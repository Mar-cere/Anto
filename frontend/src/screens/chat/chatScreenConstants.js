/**
 * Constantes compartidas para ChatScreen y sus subcomponentes.
 */

import { Dimensions } from 'react-native';
import { GUEST_CHAT_STORAGE_KEYS } from '../../constants/guestChatStorageKeys';
import { colors } from '../../styles/globalStyles';

const { width } = Dimensions.get('window');

// Textos
export const TEXTS = {
  WELCOME: '¡Hola! Soy Anto, tu asistente personal. ¿En qué puedo ayudarte hoy?',
  PLACEHOLDER: 'Escribe un mensaje...',
  LOADING: 'Cargando conversación...',
  EMPTY: 'No hay mensajes aún',
  EMPTY_SUBTITLE: 'Escribe abajo para empezar la conversación con Anto',
  ERROR_LOAD: 'Error al cargar el chat',
  ERROR_SEND: 'Error al enviar el mensaje. Por favor, intenta de nuevo.',
  ERROR_COMMUNICATION: 'Error en la comunicación',
  ERROR_CLEAR: 'Error al borrar la conversación',
  MODAL_TITLE: 'Borrar conversación',
  MODAL_MESSAGE: '¿Estás seguro de que quieres borrar toda la conversación? Esta acción no se puede deshacer.',
  CANCEL: 'Cancelar',
  DELETE: 'Borrar',
  TITLE: 'Anto',
  SUGGESTIONS_TITLE: '💡 Sugerencias para ti:',
  NETWORK_ERROR: 'Sin conexión a internet. Por favor, verifica tu conexión e intenta nuevamente.',
  OFFLINE_PENDING_ONE:
    'Tienes 1 mensaje pendiente. Se enviará al reconectar o puedes reintentar cuando haya conexión.',
  OFFLINE_PENDING_RETRY: 'Reintentar envío',
  CONVERSATION_ERROR: 'Hubo un problema al iniciar la conversación. Por favor, intenta de nuevo.',
  AI_MODAL_TITLE: 'Transparencia sobre IA',
  AI_MODAL_MESSAGE:
    'Anto usa OpenAI como proveedor de IA para responder en el chat.\n\nDatos procesados:\n• Mensajes que envías en el chat\n• Contexto mínimo de la conversación\n• Preferencias de onboarding que compartes\n• Si tienes notificaciones activas, en momentos muy intensos puede enviarse un recordatorio suave para invitarte a volver al chat (no sustituye ayuda profesional ni emergencias)\n\nPuedes revisar más detalles en la Política de Privacidad.',
  AI_MODAL_POLICY: 'Ver política de privacidad',
  AI_MODAL_DETAILS: 'Ver detalles de Privacidad e IA',
  AI_MODAL_CONTINUE: 'Entendido',
  GUEST_LIMIT_TITLE: 'Límite de mensajes',
  GUEST_LIMIT_MESSAGE:
    'Has alcanzado el máximo de mensajes sin cuenta. Crea una cuenta o inicia sesión para seguir chateando con Anto.',
  GUEST_SESSION_EXPIRED_TITLE: 'Sesión de invitado finalizada',
  GUEST_SESSION_EXPIRED_MESSAGE:
    'Tu sesión sin cuenta ha caducado o ya no es válida. Puedes crear una cuenta o iniciar sesión para seguir.',
  GUEST_RATE_LIMIT_TITLE: 'Demasiadas peticiones',
  GUEST_CONTENT_TOO_LONG_TITLE: 'Mensaje demasiado largo',
  QUICK_REPLIES_TITLE: 'Respuestas rápidas',
  /** Cuando ya hay tarjetas de técnicas encima */
  QUICK_REPLIES_TITLE_COMPACT: 'O con un toque:',
  QUICK_REPLIES_DISMISS: 'Ocultar',
  QUICK_REPLIES_HINT: 'Envía esta respuesta en el chat',
  GUEST_HANDOFF_TITLE: 'Resumen del chat sin cuenta',
  GUEST_HANDOFF_BODY:
    'Podés cargar un resumen editable en el mensaje o empezar de cero con tu cuenta.',
  GUEST_HANDOFF_PRIVACY:
    'El resumen solo está guardado en este dispositivo hasta que elijas una opción; no se envía solo ni automáticamente.',
  GUEST_HANDOFF_USE_SUMMARY: 'Usar resumen en el mensaje',
  GUEST_HANDOFF_START_FRESH: 'Empezar limpio',
  FEEDBACK_HELPFUL: 'Útil',
  FEEDBACK_NOT_HELPFUL: 'Poco útil',
  FEEDBACK_HINT: '¿Te resultó útil esta respuesta?',
  FEEDBACK_ERROR: 'No se pudo guardar tu valoración. Intenta de nuevo.',
  FEEDBACK_OFFLINE: 'Necesitas conexión para enviar la valoración.',
};

// AsyncStorage (claves invitado: `constants/guestChatStorageKeys.js` — compartidas con chatService)
export const STORAGE_KEYS = {
  CONVERSATION_ID: 'currentConversationId',
  TRIAL_BANNER_DISMISSED: 'trialBannerDismissed',
  AI_DISCLOSURE_ACK: 'aiDisclosureAcceptedV1',
  ...GUEST_CHAT_STORAGE_KEYS,
};

// Tipos y roles
export const MESSAGE_TYPES = {
  TEXT: 'text',
  ERROR: 'error',
  WELCOME: 'welcome',
  QUICK_REPLIES: 'quickReplies',
};

export const MESSAGE_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
};

export const MESSAGE_ID_PREFIXES = {
  WELCOME: 'welcome',
  TEMP: 'temp',
  ERROR: 'error',
  MESSAGE: 'msg',
};

// Animación
export const FADE_ANIMATION_DURATION = 500;
export const FADE_ANIMATION_TO_VALUE = 1;
export const TYPING_ANIMATION_DURATION = 500;
export const TYPING_ANIMATION_TO_VALUE = 1;
export const TYPING_ANIMATION_DELAYS = [0, 300, 600];
export const TYPING_TRANSLATE_Y = -4;
export const SCROLL_THRESHOLD = 100;

// UI / estilos numéricos
export const LAYOUT = {
  BACKGROUND_OPACITY: 0.1,
  CONTAINER_PADDING_TOP_IOS: 40,
  HEADER_PADDING_TOP_IOS: 30,
  HEADER_PADDING_TOP_ANDROID: 40,
  HEADER_PADDING_BOTTOM: 10,
  HEADER_PADDING_HORIZONTAL: 16,
  HEADER_AVATAR_SIZE: 30,
  MESSAGES_LIST_PADDING_HORIZONTAL: 14,
  MESSAGES_LIST_PADDING_TOP: 16,
  MESSAGES_LIST_PADDING_BOTTOM: 16,
  MESSAGE_CONTAINER_MARGIN_BOTTOM: 16,
  MESSAGE_BUBBLE_PADDING: 12,
  MESSAGE_BUBBLE_BORDER_RADIUS: 20,
  MESSAGE_BUBBLE_MARGIN_BOTTOM: 8,
  MESSAGE_BUBBLE_CORNER_RADIUS: 4,
  INPUT_CONTAINER_PADDING_HORIZONTAL: 16,
  INPUT_CONTAINER_PADDING_VERTICAL: 10,
  INPUT_CONTAINER_MARGIN_BOTTOM: 28,
  INPUT_BORDER_RADIUS: 20,
  INPUT_PADDING_HORIZONTAL: 16,
  INPUT_PADDING_VERTICAL: 10,
  INPUT_MAX_HEIGHT: 100,
  SEND_BUTTON_SIZE: 40,
  SEND_BUTTON_BORDER_RADIUS: 20,
  SEND_BUTTON_MARGIN_LEFT: 8,
  SCROLL_BUTTON_RIGHT: 16,
  SCROLL_BUTTON_BOTTOM: 80,
  SCROLL_BUTTON_SIZE: 40,
  SCROLL_BUTTON_BORDER_RADIUS: 20,
  MODAL_WIDTH_PERCENT: 0.8,
  MODAL_BORDER_RADIUS: 16,
  MODAL_PADDING: 24,
  MODAL_TITLE_MARGIN_BOTTOM: 16,
  MODAL_TEXT_MARGIN_BOTTOM: 24,
  MODAL_BUTTON_PADDING_HORIZONTAL: 16,
  MODAL_BUTTON_PADDING_VERTICAL: 10,
  MODAL_BUTTON_BORDER_RADIUS: 8,
  MODAL_BUTTON_MARGIN_LEFT: 12,
  TYPING_INDICATOR_PADDING_HORIZONTAL: 14,
  TYPING_INDICATOR_PADDING_BOTTOM: 8,
  TYPING_CONTAINER_MARGIN_BOTTOM: 8,
  TYPING_BUBBLE_MAX_WIDTH: '60%',
  TYPING_DOTS_CONTAINER_HEIGHT: 20,
  TYPING_DOT_SIZE: 6,
  TYPING_DOT_BORDER_RADIUS: 3,
  TYPING_DOT_MARGIN_HORIZONTAL: 2,
  EMPTY_CONTAINER_PADDING: 20,
  KEYBOARD_VERTICAL_OFFSET_IOS: 10,
  KEYBOARD_VERTICAL_OFFSET_ANDROID: 0,
  MAX_MESSAGE_LENGTH: 500,
  SCROLL_EVENT_THROTTLE: 16,
  FLATLIST_INITIAL_NUM_TO_RENDER: 15,
  FLATLIST_WINDOW_SIZE: 10,
  FLATLIST_MAX_TO_RENDER_PER_BATCH: 10,
  GUEST_BANNER_PADDING_VERTICAL: 8,
  GUEST_BANNER_PADDING_HORIZONTAL: 14,
};

/** Debe coincidir con `GUEST_MAX_USER_MESSAGES` en el backend */
export const GUEST_MAX_USER_MESSAGES = 5;

export function formatGuestQuotaBanner(remaining, max) {
  return `Modo sin cuenta · ${remaining} de ${max} mensajes restantes`;
}

export const CHAT_COLORS = {
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
  GUEST_BANNER_BACKGROUND: 'rgba(26, 221, 219, 0.12)',
  GUEST_BANNER_BORDER: 'rgba(26, 221, 219, 0.35)',
};

export const ICON_SIZES = {
  BACK: 24,
  MENU: 20,
  SEND: 20,
  SCROLL: 24,
};

export { width as MODAL_WIDTH_REF };
