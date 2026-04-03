/**
 * Constantes de la pantalla Configuración (SettingsScreen y subcomponentes).
 * @author AntoApp Team
 */

import { colors } from '../../styles/globalStyles';

export const TEXTS = {
  TITLE: 'Configuración',
  BACK: 'Volver',
  PREFERENCES: 'Preferencias',
  ACCOUNT: 'Cuenta',
  SUPPORT: 'Soporte',
  ABOUT: 'Acerca de',
  NOTIFICATIONS: 'Notificaciones',
  CHANGE_PASSWORD: 'Cambiar contraseña',
  LOGOUT: 'Cerrar sesión',
  DELETE_ACCOUNT: 'Eliminar cuenta',
  FAQ: 'Preguntas frecuentes',
  APP_INFO: 'Información de la aplicación',
  AI_PRIVACY: 'Privacidad e IA',
  AI_PRIVACY_DESC: 'Qué datos se procesan con IA y con qué proveedor',
  LOGOUT_TITLE: 'Cerrar sesión',
  LOGOUT_MESSAGE: '¿Estás seguro que deseas cerrar sesión?',
  DELETE_TITLE: 'Eliminar cuenta',
  DELETE_MESSAGE:
    '¿Estás seguro que deseas eliminar tu cuenta? Esta acción no se puede deshacer. Si tu plan fue contratado por Apple, también debes cancelar la suscripción desde App Store (Configuración > Apple ID > Suscripciones).',
  CANCEL: 'Cancelar',
  CONFIRM: 'Confirmar',
  DELETE: 'Eliminar',
  CLOSE: 'Cerrar',
  PERMISSIONS_NEEDED: 'Permisos necesarios',
  PERMISSIONS_MESSAGE: 'Necesitamos tu permiso para enviar notificaciones',
  ALLOW: 'Permitir',
  OK: 'OK',
  SUCCESS: 'Éxito',
  PREFERENCES_SAVED: 'Preferencias de notificaciones guardadas',
  ERROR: 'Error',
  LOGOUT_ERROR: 'No se pudo cerrar sesión',
  DELETE_ERROR: 'No se pudo eliminar la cuenta',
  PREFERENCES_ERROR: 'No se pudieron guardar las preferencias',
  PERMISSIONS_ERROR: 'No se pudo verificar los permisos de notificación',
  THERAPEUTIC_TECHNIQUES: 'Técnicas Terapéuticas',
  THERAPEUTIC_TECHNIQUES_DESC: 'Explora técnicas basadas en evidencia para tu bienestar',
  SUBSCRIPTION: 'Suscripción Premium',
  SUBSCRIPTION_DESC: 'Gestiona tu suscripción y planes disponibles',
  TRANSACTION_HISTORY: 'Historial de Transacciones',
  TRANSACTION_HISTORY_DESC: 'Ver historial completo de tus pagos y suscripciones',
  PERSONALIZATION_INTRO:
    'Ajusta cómo te habla Anto en el chat. Puedes cambiarlo cuando quieras; en situaciones de mucha angustia o riesgo el tono prioriza tu seguridad.',
  RESPONSE_STYLE_EXPLAINER:
    'Longitud y forma: breve, equilibrado, profundo, empático, directo, etc. Toca el valor para rotar estilos.',
  CHAT_TONE_TITLE: 'Tono del chat con Anto',
  CHAT_TONE_SUB: 'Opcional: menos frases repetidas o más preguntas',
  CHAT_PREF_LESS_VALIDATION: 'Menos validación genérica',
  CHAT_PREF_LESS_VALIDATION_DESC: 'Prioriza sustancia y preguntas útiles',
  CHAT_PREF_NO_APOLOGY: 'Evitar disculpas de apertura',
  CHAT_PREF_NO_APOLOGY_DESC: 'Menos "lo siento" o "lamento" al empezar',
  CHAT_PREF_MORE_QUESTIONS: 'Más preguntas, menos monólogo',
  CHAT_PREF_MORE_QUESTIONS_DESC: 'Respuestas con 1–2 preguntas claras',
};

export const STORAGE_KEYS = { NOTIFICATIONS: 'notifications' };

export const NAVIGATION_ROUTES = {
  SIGN_IN: 'SignIn',
  CHANGE_PASSWORD: 'ChangePassword',
  FAQ: 'FAQ',
  FAQ_ALT: 'FaQ',
  ABOUT: 'About',
  AI_PRIVACY: 'AIPrivacy',
};

export const SCROLL_PADDING_BOTTOM = 32;
export const ICON_SIZE = 24;
export const MODAL_WIDTH = '80%';
export const MODAL_OVERLAY_OPACITY = 0.5;

export const COLORS = {
  BACKGROUND: colors.background,
  PRIMARY: colors.primary,
  WHITE: colors.white,
  ACCENT: '#A3B8E8',
  ERROR: '#FF6B6B',
  SWITCH_DISABLED: '#ccc',
  ITEM_BACKGROUND: 'rgba(29, 43, 95, 0.8)',
  ITEM_BORDER: 'rgba(26, 221, 219, 0.1)',
  MODAL_OVERLAY: `rgba(0, 0, 0, ${MODAL_OVERLAY_OPACITY})`,
  MODAL_BACKGROUND: '#1D2B5F',
  MODAL_BUTTON_CANCEL: 'rgba(26, 221, 219, 0.1)',
  MODAL_BUTTON_DELETE: 'rgba(255, 107, 107, 0.1)',
};

export const RESPONSE_STYLE_LABELS = {
  brief: 'Breve',
  balanced: 'Equilibrado',
  deep: 'Profundo',
  empatico: 'Empático',
  profesional: 'Profesional',
  directo: 'Directo',
  calido: 'Cálido',
  estructurado: 'Estructurado',
};
export const RESPONSE_STYLES = ['brief', 'balanced', 'deep', 'empatico', 'profesional', 'directo', 'calido', 'estructurado'];
