/**
 * Constantes compartidas para ChatScreen y sus subcomponentes.
 */

import { useMemo } from 'react';
import { Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { GUEST_CHAT_STORAGE_KEYS } from '../../constants/guestChatStorageKeys';
import { SESSION_INTENTION_VALUES } from '../../constants/sessionIntention';
import { SPACING } from '../../constants/ui';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { getFocusTheme } from '../../styles/focusCardTheme';
import { lightColors } from '../../styles/themePalettes';

const SESSION_INTENTION_ICONS = {
  vent: 'hand-heart-outline',
  organize: 'puzzle-outline',
  technique: 'weather-windy',
  plan: 'clipboard-check-outline',
};

const { width } = Dimensions.get('window');

/** Mismo inset horizontal que el resto de la app (`SPACING.SCREEN_EDGE_INSET`). */
const GUTTER = SPACING.SCREEN_EDGE_INSET;

// Textos
export const TEXTS = {
  WELCOME: '¡Hola! Soy Anto, tu asistente personal. ¿En qué puedo ayudarte hoy?',
  PLACEHOLDER: 'Escribe un mensaje...',
  LOADING: 'Cargando conversación...',
  EMPTY: 'No hay mensajes aún',
  EMPTY_KICKER: 'Conversación',
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
  /** Menú ⋮ del encabezado del chat */
  CHAT_OPTIONS_TITLE: 'Opciones del chat',
  CHAT_OPTIONS_LAST_MESSAGE: 'Ir al último mensaje',
  CHAT_OPTIONS_CUSTOMIZE: 'Personalización del chat',
  CHAT_OPTIONS_AI_PRIVACY: 'Privacidad e IA',
  CHAT_OPTIONS_AI_LIMITS: 'Límites de la IA',
  CHAT_OPTIONS_AI_INFO: 'Uso de la inteligencia artificial',
  CHAT_OPTIONS_CLEAR: 'Borrar esta conversación',
  CHAT_OPTIONS_CANCEL: 'Cerrar',
  CHAT_MENU_A11Y_LABEL: 'Opciones del chat',
  CHAT_MENU_A11Y_HINT:
    'Abre un menú con ir al último mensaje, personalización, privacidad, información sobre IA o borrar la conversación',
  SUGGESTIONS_TITLE: 'Sugerencias para ti',
  SUGGESTIONS_PERSONALIZED_HINT: 'ordenadas según tu historial',
  PRODUCT_ACTIONS_TITLE: 'Puedes guardarlo en la app',
  NETWORK_ERROR: 'Sin conexión a internet. Por favor, verifica tu conexión e intenta nuevamente.',
  OFFLINE_PENDING_ONE:
    'Tienes 1 mensaje pendiente. Se enviará al reconectar o puedes reintentar cuando haya conexión.',
  OFFLINE_PENDING_RETRY: 'Reintentar envío',
  CONVERSATION_ERROR: 'Hubo un problema al iniciar la conversación. Por favor, intenta de nuevo.',
  AI_MODAL_TITLE: 'Transparencia sobre IA',
  AI_MODAL_MESSAGE:
    'En Anto el chat va junto al resto de la experiencia: tareas, hábitos y seguimiento en la app, con reglas y límites que aplicamos desde nuestros servidores.\n\nPara redactar las respuestas del asistente usamos modelos de lenguaje de OpenAI. Cada respuesta se genera con el contexto que Anto prepara y envía según sus políticas. Esto no sustituye terapia ni emergencias.\n\nDatos que pueden enviarse para esa generación:\n• Mensajes que escribes en el chat\n• Contexto mínimo de la conversación\n• Preferencias de onboarding que compartes\n• Si tienes notificaciones activas, en momentos muy intensos puede enviarse un recordatorio suave para invitarte a volver al chat (no sustituye ayuda profesional ni emergencias)\n\nPuedes revisar más detalles en la Política de Privacidad.',
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
  GUEST_RATE_LIMIT_MESSAGE:
    'Llegaste al límite temporal de solicitudes. Espera un momento e intenta de nuevo.',
  GUEST_CONTENT_TOO_LONG_TITLE: 'Mensaje demasiado largo',
  GUEST_HANDOFF_TITLE: 'Resumen del chat sin cuenta',
  GUEST_HANDOFF_BODY:
    'Puedes cargar un resumen editable en el mensaje o empezar de cero con tu cuenta.',
  GUEST_HANDOFF_PRIVACY:
    'El resumen solo está guardado en este dispositivo hasta que elijas una opción; no se envía solo ni automáticamente.',
  GUEST_HANDOFF_USE_SUMMARY: 'Usar resumen en el mensaje',
  GUEST_HANDOFF_START_FRESH: 'Empezar limpio',
  FEEDBACK_HELPFUL: 'Útil',
  FEEDBACK_NOT_HELPFUL: 'Poco útil',
  FEEDBACK_HINT: '¿Te resultó útil esta respuesta?',
  FEEDBACK_ERROR: 'No se pudo guardar tu valoración. Intenta de nuevo.',
  FEEDBACK_OFFLINE: 'Necesitas conexión para enviar la valoración.',
  /** Intención de sesión (#72) */
  SESSION_INTENTION_TITLE: '¿Cómo quieres que te acompañe hoy?',
  SESSION_INTENTION_SUBTITLE: 'Eliges en un toque. Siempre puedes escribir libremente.',
  SESSION_INTENTION_KICKER: 'Tu sesión',
  SESSION_INTENTION_SKIP: 'Omitir',
  SESSION_INTENTION_SKIP_HINT: 'Continúa el chat sin elegir un enfoque',
  SESSION_INTENTION_VENT_LABEL: 'Desahogar',
  SESSION_INTENTION_VENT_HINT: 'Más escucha, menos consejos',
  SESSION_INTENTION_ORGANIZE_LABEL: 'Ordenar pensamiento',
  SESSION_INTENTION_ORGANIZE_HINT: 'Aclarar y nombrar lo que pasa',
  SESSION_INTENTION_TECHNIQUE_LABEL: 'Técnica o regulación',
  SESSION_INTENTION_TECHNIQUE_HINT: 'Pasos breves para calmarte',
  SESSION_INTENTION_PLAN_LABEL: 'Planificar',
  SESSION_INTENTION_PLAN_HINT: 'Pasos concretos para avanzar',
  HEADER_BACK_LABEL: 'Volver',
  HEADER_BACK_HINT: 'Doble toque para salir del chat',
  INPUT_A11Y_LABEL: 'Mensaje para Anto',
  INPUT_A11Y_HINT: 'Escribe tu mensaje y usa el botón enviar',
  INPUT_SEND_A11Y_LABEL: 'Enviar mensaje',
  SCROLL_TO_BOTTOM_LABEL: 'Ir al final de la conversación',
  AI_DISCLOSURE_READ_WARN: 'No se pudo leer estado de disclosure IA:',
  AI_DISCLOSURE_SAVE_WARN: 'No se pudo guardar aceptación de disclosure IA:',
  PRIVACY_OPEN_WARN: 'No se pudo abrir política de privacidad:',
  PRIVACY_SCREEN_WARN: 'No se pudo abrir pantalla de Privacidad e IA:',
  SETTINGS_OPEN_WARN: 'No se pudo abrir Ajustes desde el chat:',
  NAVIGATION_ERROR_WARN: 'Error navegando a pantalla:',
  GUEST_MODE_BANNER: 'Modo sin cuenta',
  GUEST_MESSAGES_REMAINING: 'mensajes restantes',
  GUEST_QUOTA_BANNER_TEMPLATE: '{banner} · {remaining} de {max} {label}',
  COMMON_OK: 'OK',
  COMMON_CANCEL: 'Cancelar',
  COMMON_CREATE_ACCOUNT: 'Crear cuenta',
  COMMON_SIGN_IN: 'Iniciar sesión',
  SUBSCRIPTION_REQUIRED_TITLE: 'Suscripción requerida',
  SUBSCRIPTION_REQUIRED_DEFAULT:
    'Necesitas una suscripción activa para usar el chat. Tu período de prueba ha expirado.',
  SUBSCRIPTION_VIEW_PLANS: 'Ver planes',
  MESSAGE_IN_FLIGHT_DEFAULT: 'Este mensaje ya se está enviando.',
  SEND_TIMEOUT_DEFAULT: 'La respuesta tardó demasiado. Intenta de nuevo.',
  NETWORK_ERROR_INIT: 'Error al cargar el chat',
  EMERGENCY_ALERT_SENT_TITLE: 'Alerta de Emergencia Enviada',
  EMERGENCY_ALERT_SENT_BODY:
    'Hemos notificado a {successful} de {total} contacto(s) de emergencia.',
  PRODUCT_PROPOSAL_TYPE_HABIT: 'Hábito',
  PRODUCT_PROPOSAL_TYPE_TASK: 'Tarea',
  PRODUCT_PROPOSAL_HINT_EDIT: 'Editar rápido',
  PRODUCT_PROPOSAL_LABEL_HABIT: 'Sugerencia de hábito',
  PRODUCT_PROPOSAL_LABEL_TASK: 'Sugerencia de tarea',
  PRODUCT_PROPOSAL_CONTEXT_PREFIX: 'Contexto:',
  PRODUCT_PROPOSAL_TITLE_PLACEHOLDER: 'Título (verbo + objeto + contexto)',
  PRODUCT_PROPOSAL_WHEN_PLACEHOLDER: 'Fecha/hora opcional (YYYY-MM-DD HH:mm)',
  PRODUCT_PROPOSAL_CREATE: 'Crear',
  PRODUCT_PROPOSAL_DISMISS: 'No aplica',
  CHAT_COMMITMENT_PROPOSE_TITLE: '¿Lo dejamos para retomar?',
  CHAT_COMMITMENT_SAVE: 'Guardar',
  CHAT_COMMITMENT_SAVING: 'Guardando…',
  CHAT_COMMITMENT_SAVED: 'Listo: lo guardamos para retomar',
  CHAT_COMMITMENT_SAVE_ERROR: 'No se pudo guardar. Prueba de nuevo.',
  CHAT_COMMITMENT_EDIT_SAVE: 'Editar y guardar',
  CHAT_COMMITMENT_DISMISS: 'Ahora no',
  CHAT_COMMITMENT_LABEL_PLACEHOLDER: 'Algo breve para retomar',
  CHAT_COMMITMENT_DEFAULT_LABEL: 'Retomar este tramo cuando te venga bien',
  PRODUCT_STATUS_COOLDOWN_WITH_MIN:
    'Sugerencias en pausa unos minutos ({minutes} min) para no saturar la conversación.',
  PRODUCT_STATUS_COOLDOWN:
    'Sugerencias en pausa un momento para no saturar la conversación.',
  PRODUCT_STATUS_CAP:
    'En esta conversación ya alcanzamos el límite de sugerencias por ahora.',
  PRODUCT_STATUS_REJECT_STREAK:
    'Reducimos la intensidad de las sugerencias porque no parecían útiles.',
  SUGGESTION_TRY_PREFIX: 'Quiero probar: ',
  GUEST_HANDOFF_PREFILL_PREFIX:
    'Continuando desde el chat sin cuenta (puedes editar esto antes de enviar):',
};

export function useChatTexts() {
  const translated = useSectionTranslations('CHAT');
  return useMemo(() => ({ ...TEXTS, ...(translated || {}) }), [translated]);
}

/** Opciones de intención de sesión (ids alineados a `SESSION_INTENTION_VALUES` en API) */
export const SESSION_INTENTION_OPTIONS = SESSION_INTENTION_VALUES.map((id) => ({
  id,
  label: TEXTS[`SESSION_INTENTION_${id.toUpperCase()}_LABEL`] || id,
  hint: TEXTS[`SESSION_INTENTION_${id.toUpperCase()}_HINT`] || '',
}));

export function useSessionIntentionOptions() {
  const T = useChatTexts();
  return SESSION_INTENTION_VALUES.map((id) => ({
    id,
    icon: SESSION_INTENTION_ICONS[id] || 'circle-outline',
    label:
      T[`SESSION_INTENTION_${id.toUpperCase()}_LABEL`] ||
      TEXTS[`SESSION_INTENTION_${id.toUpperCase()}_LABEL`] ||
      id,
    hint:
      T[`SESSION_INTENTION_${id.toUpperCase()}_HINT`] ||
      TEXTS[`SESSION_INTENTION_${id.toUpperCase()}_HINT`] ||
      '',
  }));
}

// AsyncStorage (claves invitado: `constants/guestChatStorageKeys.js` — compartidas con chatService)
export const STORAGE_KEYS = {
  CONVERSATION_ID: 'currentConversationId',
  TRIAL_BANNER_DISMISSED: 'trialBannerDismissed',
  CHAT_IMMERSIVE_MODE: 'chatImmersiveModeV1',
  /** Bump si cambia el texto legal/transparencia del modal (vuelve a mostrarse una vez). */
  AI_DISCLOSURE_ACK: 'aiDisclosureAcceptedV3',
  ...GUEST_CHAT_STORAGE_KEYS,
};

// Tipos y roles
export const MESSAGE_TYPES = {
  TEXT: 'text',
  ERROR: 'error',
  WELCOME: 'welcome',
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
  HEADER_PADDING_HORIZONTAL: GUTTER,
  HEADER_AVATAR_SIZE: 30,
  MESSAGES_LIST_PADDING_HORIZONTAL: GUTTER,
  MESSAGES_LIST_PADDING_TOP: 16,
  MESSAGES_LIST_PADDING_BOTTOM: 16,
  MESSAGE_CONTAINER_MARGIN_BOTTOM: 16,
  MESSAGE_BUBBLE_PADDING: 12,
  MESSAGE_BUBBLE_BORDER_RADIUS: 22,
  MESSAGE_BUBBLE_MARGIN_BOTTOM: 8,
  MESSAGE_BUBBLE_CORNER_RADIUS: 6,
  INPUT_CONTAINER_PADDING_HORIZONTAL: GUTTER,
  INPUT_CONTAINER_PADDING_VERTICAL: 10,
  /** Respiro interno sobre el safe area (ya no deja hueco debajo del composer). */
  INPUT_DOCK_PADDING_BOTTOM_EXTRA: 10,
  INPUT_BORDER_RADIUS: 22,
  INPUT_PADDING_HORIZONTAL: GUTTER,
  INPUT_PADDING_VERTICAL: 10,
  INPUT_MAX_HEIGHT: 100,
  SEND_BUTTON_SIZE: 40,
  SEND_BUTTON_BORDER_RADIUS: 22,
  SEND_BUTTON_MARGIN_LEFT: 8,
  SCROLL_BUTTON_RIGHT: 16,
  SCROLL_BUTTON_BOTTOM: 80,
  SCROLL_BUTTON_SIZE: 40,
  SCROLL_BUTTON_BORDER_RADIUS: 22,
  MODAL_WIDTH_PERCENT: 0.8,
  MODAL_BORDER_RADIUS: 22,
  MODAL_PADDING: 24,
  MODAL_TITLE_MARGIN_BOTTOM: 16,
  MODAL_TEXT_MARGIN_BOTTOM: 24,
  MODAL_BUTTON_PADDING_HORIZONTAL: GUTTER,
  MODAL_BUTTON_PADDING_VERTICAL: 10,
  MODAL_BUTTON_BORDER_RADIUS: 8,
  MODAL_BUTTON_MARGIN_LEFT: 12,
  TYPING_INDICATOR_PADDING_HORIZONTAL: GUTTER,
  TYPING_INDICATOR_PADDING_BOTTOM: 8,
  TYPING_CONTAINER_MARGIN_BOTTOM: 8,
  TYPING_BUBBLE_MAX_WIDTH: '60%',
  TYPING_DOTS_CONTAINER_HEIGHT: 20,
  TYPING_DOT_SIZE: 6,
  TYPING_DOT_BORDER_RADIUS: 3,
  TYPING_DOT_MARGIN_HORIZONTAL: 2,
  KEYBOARD_VERTICAL_OFFSET_IOS: 10,
  KEYBOARD_VERTICAL_OFFSET_ANDROID: 0,
  MAX_MESSAGE_LENGTH: 12000,
  SCROLL_EVENT_THROTTLE: 16,
  FLATLIST_INITIAL_NUM_TO_RENDER: 15,
  FLATLIST_WINDOW_SIZE: 10,
  FLATLIST_MAX_TO_RENDER_PER_BATCH: 10,
  GUEST_BANNER_PADDING_VERTICAL: 8,
  GUEST_BANNER_PADDING_HORIZONTAL: GUTTER,
  EMPTY_CONTAINER_PADDING_VERTICAL: 20,
  EMPTY_CONTAINER_PADDING_HORIZONTAL: GUTTER,
};

/** Debe coincidir con `GUEST_MAX_USER_MESSAGES` en el backend */
export const GUEST_MAX_USER_MESSAGES = 5;

export function formatGuestQuotaBanner(remaining, max, texts = TEXTS) {
  const template =
    texts.GUEST_QUOTA_BANNER_TEMPLATE ||
    '{banner} · {remaining} de {max} {label}';
  return template
    .replace('{banner}', texts.GUEST_MODE_BANNER)
    .replace('{remaining}', String(remaining))
    .replace('{max}', String(max))
    .replace('{label}', texts.GUEST_MESSAGES_REMAINING);
}

export function createChatColors(colors, resolvedScheme = 'light') {
  const t = getFocusTheme(colors, resolvedScheme);
  return {
    BACKGROUND: colors.background,
    PRIMARY: colors.primary,
    WHITE: colors.white,
    ACCENT: t.FOCUS_KICKER_COLOR,
    ERROR: colors.error,
    HEADER_BACKGROUND: colors.background,
    HEADER_BORDER: colors.border,
    USER_BUBBLE: colors.primary,
    USER_TEXT: colors.textOnPrimary ?? colors.white,
    BOT_BUBBLE: colors.assistantBubble ?? colors.cardBackground,
    BOT_BUBBLE_BORDER: colors.assistantBubbleBorder ?? colors.border,
    BOT_TEXT: colors.text,
    INPUT_BACKGROUND: colors.glassFillStrong ?? colors.glassFill,
    INPUT_BORDER: colors.glassOutline ?? colors.border,
    INPUT_FIELD_BACKGROUND: colors.surface,
    INPUT_FIELD_BORDER: colors.border,
    INPUT_PLACEHOLDER: colors.textMuted ?? colors.textSecondary,
    INPUT_DOCK_TINT_LIGHT: 'rgba(255, 255, 255, 0.72)',
    INPUT_DOCK_TINT_DARK: 'rgba(8, 12, 28, 0.82)',
    INPUT_DOCK_TOP_LINE: colors.accentLineSoft ?? colors.border,
    SEND_BUTTON_BACKGROUND: colors.accentLineSoft,
    SEND_BUTTON_BORDER: t.FOCUS_ACCENT_BORDER,
    SEND_BUTTON_DISABLED_BACKGROUND: colors.chromeInputDisabled,
    SCROLL_BUTTON_BACKGROUND: colors.accentLineSoft,
    SCROLL_BUTTON_BORDER: t.FOCUS_ACCENT_BORDER,
    MODAL_OVERLAY: colors.overlay,
    MODAL_BACKGROUND: colors.modalSurface,
    MODAL_BORDER: colors.glassOutline ?? colors.border,
    MODAL_CANCEL_BACKGROUND: colors.accentLineSoft,
    MODAL_CONFIRM_BACKGROUND: colors.dangerSoft ?? 'rgba(255, 100, 100, 0.14)',
    MODAL_CONFIRM_BORDER: colors.dangerBorder ?? 'rgba(255, 100, 100, 0.45)',
    ERROR_BUBBLE_BACKGROUND: colors.dangerSoft ?? 'rgba(255, 100, 100, 0.08)',
    ERROR_BUBBLE_BORDER: colors.error,
    TYPING_BUBBLE_BACKGROUND: colors.assistantBubble ?? colors.cardBackground,
    TYPING_DOT: colors.primary,
    GUEST_BANNER_BACKGROUND: colors.accentLineSoft,
    GUEST_BANNER_BORDER: colors.accentLine ?? colors.border,
  };
}

/** Paleta del chat según el tema activo (dentro de ThemeProvider). */
export function useChatColors() {
  const { colors, resolvedScheme } = useTheme();
  return useMemo(() => createChatColors(colors, resolvedScheme), [colors, resolvedScheme]);
}

/** Compatibilidad legacy (tests/archivos no migrados) */
export const CHAT_COLORS = createChatColors(lightColors, 'light');

export const ICON_SIZES = {
  BACK: 24,
  MENU: 20,
  SEND: 20,
  SCROLL: 24,
};

export { width as MODAL_WIDTH_REF };
