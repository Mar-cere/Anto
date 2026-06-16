/**
 * Constantes de la pantalla Configuración (SettingsScreen y subcomponentes).
 * @author AntoApp Team
 */
import { useMemo } from 'react';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { ROUTES } from '../../constants/routes';

export const TEXTS = {
  TITLE: 'Configuración',
  BACK: 'Volver',
  /** @deprecated Preferir SECTION_SYSTEM en UI */
  PREFERENCES: 'Preferencias',
  SECTION_SYSTEM: 'Sistema',
  SECTION_SYSTEM_INTRO: 'Tema, país y notificaciones.',
  SECTION_CHAT: 'Chat',
  SECTION_CHAT_INTRO:
    'Estilo y tono. Amplía la fila para ajustar.',
  SECTION_PATTERNS: 'Patrones y señales',
  SECTION_PATTERNS_INTRO:
    'Informes observacionales y datos opcionales del dispositivo. No son diagnóstico.',
  PATTERNS_OPEN_WEEKLY: 'Patrones de la semana',
  PATTERNS_OPEN_SUMMARY: 'Resumen de actividad',
  PATTERNS_OPEN_GRAPH: 'Mapa de temas e intervenciones',
  /** Solo visible al expandir «Personalización del chat». */
  CHAT_EXPANDED_DISCLAIMER:
    'Puedes cambiar las opciones cuando quieras. En situaciones de mucha angustia o riesgo el tono prioriza tu seguridad.',
  CHAT_CUSTOMIZATION_TITLE: 'Personalización del chat',
  CHAT_CUSTOMIZATION_A11Y_EXPANDED: 'Personalización del chat, panel expandido',
  CHAT_CUSTOMIZATION_A11Y_COLLAPSED: 'Personalización del chat, panel contraído',
  CHAT_CUSTOMIZATION_A11Y_HINT:
    'Doble toque para mostrar u ocultar estilo, tono y técnicas',
  CHAT_SUMMARY_STYLE_PREFIX: 'Estilo:',
  CHAT_SUMMARY_EXPANDED_HINT: 'Toca de nuevo para cerrar',
  SECTION_ACCOUNT_AND_PLAN: 'Cuenta y suscripción',
  SECTION_ACCOUNT_INTRO: 'Plan, pagos y acceso.',
  ACCOUNT: 'Cuenta',
  SUPPORT: 'Soporte',
  ABOUT: 'Acerca de',
  NOTIFICATIONS: 'Notificaciones',
  NOTIFICATIONS_SAVED: 'Guardado',
  NOTIFICATIONS_A11Y_EXPANDED: 'Notificaciones, panel expandido',
  NOTIFICATIONS_A11Y_COLLAPSED: 'Notificaciones, panel contraído',
  NOTIFICATIONS_A11Y_HINT:
    'Doble toque para mostrar u ocultar tipos y horarios',
  NOTIFICATIONS_SUB_COLLAPSED_HINT: 'Toca para tipos y horarios',
  NOTIFICATIONS_SUB_EXPANDED: 'Tipos y horarios',
  NOTIFICATIONS_TYPES_TITLE: 'Tipos',
  NOTIFICATIONS_TYPE_DAILY: 'Diarios y motivación',
  NOTIFICATIONS_TYPE_TASKS: 'Tareas y hábitos',
  NOTIFICATIONS_TYPE_BETWEEN_SESSIONS: 'Invitación a retomar el chat',
  NOTIFICATIONS_ADVANCED_TITLE: 'Avanzado',
  NOTIFICATIONS_ADVANCED_SUB: 'Horarios y ajustes extra (opcional)',
  NOTIFICATIONS_ADVANCED_A11Y_EXPANDED: 'Avanzado de notificaciones, expandido',
  NOTIFICATIONS_ADVANCED_A11Y_COLLAPSED: 'Avanzado de notificaciones, colapsado',
  NOTIFICATIONS_SCHEDULES_TITLE: 'Horarios (opcional)',
  NOTIFICATIONS_MORNING: 'Mañana',
  NOTIFICATIONS_EVENING: 'Noche',
  NOTIFICATIONS_HINT_DISABLED:
    'Activa el switch de Notificaciones para poder ajustar tipos y horarios.',
  NOTIFICATIONS_HINT_SCHEDULE:
    'Para configurar horarios, activa «Diarios y motivación».',
  NOTIFICATIONS_TIME_DONE: 'Listo',
  NOTIFICATIONS_TIME_PICKER_CLOSE_A11Y: 'Cerrar selector de hora',
  NOTIFICATIONS_SAVING_A11Y: 'Guardando preferencias de notificaciones',
  NOTIFICATIONS_A11Y_PUSH_TOGGLE: 'Activar o desactivar notificaciones push',
  NOTIFICATIONS_A11Y_MORNING_TIME_PREFIX: 'Hora del recordatorio de mañana',
  NOTIFICATIONS_A11Y_EVENING_TIME_PREFIX: 'Hora del recordatorio de noche',
  NOTIFICATIONS_A11Y_ENABLE_MORNING: 'Activar recordatorio de mañana',
  NOTIFICATIONS_A11Y_ENABLE_EVENING: 'Activar recordatorio de noche',
  DEV_NOTIFICATIONS_TEST_SECTION: 'Pruebas (Solo Desarrollo)',
  DEV_NOTIFICATIONS_TEST_WARNING: 'Probar WARNING',
  DEV_NOTIFICATIONS_TEST_MEDIUM: 'Probar MEDIUM',
  DEV_NOTIFICATIONS_TEST_FOLLOWUP: 'Probar Seguimiento',
  INSTAGRAM: 'Instagram',
  INSTAGRAM_OPEN_ERROR: 'No se pudo abrir Instagram. Intenta más tarde.',
  LINK_OPEN_ERROR: 'No se pudo abrir el enlace.',
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
  NOTIFICATIONS_SESSION_SYNC_WARNING:
    'No se pudo actualizar la sesión tras guardar los ajustes de notificaciones.',
  PUSH_ENABLED_SYNC_WARNING:
    'Notificaciones habilitadas, pero no se pudo actualizar la sesión.',
  PUSH_ENABLED_SUCCESS:
    'Notificaciones push habilitadas. Recibirás alertas sobre crisis y seguimientos.',
  PUSH_REGISTER_ERROR:
    'No se pudo registrar el dispositivo para notificaciones push.',
  PUSH_DISABLED_SYNC_WARNING:
    'Notificaciones deshabilitadas, pero no se pudo actualizar la sesión.',
  PUSH_DISABLED_SUCCESS:
    'Notificaciones deshabilitadas. No recibirás alertas sobre crisis.',
  TEST_NOTIFICATION_WARNING_SENT:
    'Notificación WARNING de prueba enviada al dispositivo.',
  TEST_NOTIFICATION_MEDIUM_SENT:
    'Notificación MEDIUM de prueba enviada al dispositivo.',
  TEST_NOTIFICATION_FOLLOWUP_SENT:
    'Notificación de seguimiento de prueba enviada al dispositivo.',
  TEST_NOTIFICATION_SENT: 'Notificación de prueba enviada.',
  ERROR: 'Error',
  LOGOUT_ERROR: 'No se pudo cerrar sesión',
  DELETE_ERROR: 'No se pudo eliminar la cuenta',
  ACCOUNT_DELETED_SUCCESS:
    'Tu cuenta ha sido eliminada. Las suscripciones activas quedaron canceladas.',
  PREFERENCES_ERROR: 'No se pudieron guardar las preferencias',
  CHAT_PREF_SYNC_WARNING:
    'No se pudo actualizar la sesión. Intenta cerrar sesión y volver a entrar.',
  RESPONSE_STYLE_SYNC_WARNING:
    'No se pudo actualizar la sesión tras cambiar el estilo.',
  RESPONSE_STYLE_UPDATED_PREFIX: 'Estilo de respuesta',
  THEME_SYNC_WARNING:
    'El tema se aplicó en este dispositivo, pero no se pudo sincronizar con la cuenta.',
  PERMISSIONS_ERROR: 'No se pudo verificar los permisos de notificación',
  THERAPEUTIC_TECHNIQUES: 'Técnicas Terapéuticas',
  THERAPEUTIC_TECHNIQUES_DESC:
    'Explora técnicas basadas en evidencia para tu bienestar',
  SUBSCRIPTION: 'Suscripción Premium',
  SUBSCRIPTION_DESC: 'Gestiona tu suscripción y planes disponibles',
  TRANSACTION_HISTORY: 'Historial de Transacciones',
  TRANSACTION_HISTORY_DESC:
    'Ver historial completo de tus pagos y suscripciones',
  /** @deprecated Agrupado bajo SECTION_ACCOUNT_AND_PLAN */
  PLAN_SECTION: 'Plan y pagos',
  /** @deprecated Usar SECTION_CHAT_INTRO */
  PERSONALIZATION_INTRO:
    'Ajusta cómo te habla Anto en el chat. Puedes cambiarlo cuando quieras; en situaciones de mucha angustia o riesgo el tono prioriza tu seguridad.',
  RESPONSE_STYLE_EXPLAINER:
    'Elige cómo se formula cada respuesta: longitud, calidez y estructura. Abre la lista para comparar con ejemplos.',
  RESPONSE_STYLE_MODAL_TITLE: 'Estilo de respuesta de Anto',
  RESPONSE_STYLE_MODAL_SUB:
    'Ejemplos orientativos; en chat real Anto adapta el mensaje a tu situación.',
  RESPONSE_STYLE_PREVIEW_LABEL: 'Vista previa',
  /** Subsección dentro de «Chat» (antes de la fila que abre el modal de estilo). */
  CHAT_SUBSECTION_RESPONSE_STYLE: 'Estilo de respuesta',
  /** En la fila compacta; el detalle largo queda en el modal. */
  RESPONSE_STYLE_ROW_SUB: 'Longitud y tono de cada mensaje',
  RESPONSE_STYLE_A11Y_LABEL: 'Elegir estilo de respuesta de Anto',
  RESPONSE_STYLE_A11Y_HINT: 'Abre una lista con ejemplos de cada estilo',
  CHAT_TONE_TITLE: 'Tono del chat con Anto',
  CHAT_TONE_SUB: 'Opciones opcionales de estilo',
  CHAT_PREF_LESS_VALIDATION: 'Menos validación genérica',
  CHAT_PREF_LESS_VALIDATION_DESC: 'Prioriza sustancia y preguntas útiles',
  CHAT_PREF_NO_APOLOGY: 'Evitar disculpas de apertura',
  CHAT_PREF_NO_APOLOGY_DESC: 'Menos "lo siento" o "lamento" al empezar',
  CHAT_PREF_MORE_QUESTIONS: 'Más preguntas, menos monólogo',
  CHAT_PREF_MORE_QUESTIONS_DESC: 'Respuestas con 1–2 preguntas claras',
  CHAT_TONE_APPLIES_HINT:
    'Se aplican en las próximas respuestas del chat; no modifican mensajes que ya envió Anto.',
  APPEARANCE: 'Apariencia',
  APPEARANCE_ROW_SUB: 'Claro, oscuro o según el sistema',
  LANGUAGE: 'Idioma',
  LANGUAGE_ROW_SUB: 'Idioma de la interfaz',
  LANGUAGE_MODAL_TITLE: 'Idioma de la aplicación',
  LANGUAGE_HINT: 'Puedes cambiar el idioma cuando quieras.',
  LANGUAGE_CHANGED_OK: 'Idioma actualizado',
  LANGUAGE_CHANGED_SYNC_WARNING:
    'Idioma aplicado en este dispositivo, pero no se pudo sincronizar con la cuenta.',
  COUNTRY: 'País o región',
  COUNTRY_ROW_SUB: 'Números de emergencia en situaciones de crisis',
  COUNTRY_MODAL_TITLE: 'País o región',
  COUNTRY_HINT:
    'No usamos GPS. Si eliges Automático, usamos el idioma o la hora de tu dispositivo.',
  COUNTRY_AUTO_LABEL: 'Automático',
  COUNTRY_AUTO_DESC: 'Según idioma u hora del dispositivo',
  COUNTRY_DETECTED_SUFFIX: '(detectado)',
  COUNTRY_CHANGED_OK: 'País actualizado',
  COUNTRY_CHANGED_SYNC_WARNING:
    'País aplicado en este dispositivo, pero no se pudo sincronizar con la cuenta.',
  COUNTRY_SAVING_A11Y: 'Guardando país',
  THEME_MODAL_TITLE: 'Tema de la interfaz',
  THEME_LIGHT: 'Claro',
  THEME_DARK: 'Oscuro',
  THEME_SYSTEM: 'Sistema',
  THEME_HINT:
    '“Sistema” sigue el modo claro u oscuro del teléfono. También se guarda en tu cuenta cuando inicias sesión.',
};

export function useSettingsTexts() {
  const translated = useSectionTranslations('SETTINGS');
  return useMemo(() => ({ ...TEXTS, ...(translated || {}) }), [translated]);
}

export const STORAGE_KEYS = { NOTIFICATIONS: 'notifications' };

export const NAVIGATION_ROUTES = {
  SIGN_IN: ROUTES.SIGN_IN,
  CHANGE_PASSWORD: ROUTES.CHANGE_PASSWORD,
  FAQ: 'FAQ',
  FAQ_ALT: 'FaQ',
  ABOUT: 'About',
  AI_PRIVACY: 'AIPrivacy',
};

export const SCROLL_PADDING_BOTTOM = 32;
export const ICON_SIZE = 24;
export const MODAL_WIDTH = '80%';

/** Paleta derivada del tema activo (useTheme().colors) */
export function buildSettingsCOLORS(colors) {
  return {
    BACKGROUND: colors.background,
    PRIMARY: colors.primary,
    WHITE: colors.white,
    ACCENT: colors.primaryBright,
    ERROR: colors.error,
    /** Thumb del Switch en posición apagada */
    SWITCH_DISABLED: colors.textSecondary,
    ITEM_BACKGROUND: colors.chromeCard,
    ITEM_BORDER: colors.chromeCardBorder,
    MODAL_OVERLAY: colors.overlay,
    MODAL_BACKGROUND: colors.modalSurface,
    MODAL_BUTTON_CANCEL: colors.accentLineSoft,
    MODAL_BUTTON_DELETE: colors.dangerSoft,
  };
}

export const RESPONSE_STYLE_LABELS = {
  brief: 'Breve',
  balanced: 'Equilibrado',
  deep: 'Profundo',
  empatico: 'Empático',
  estructurado: 'Estructurado',
};

/** Frases de ejemplo por estilo (tono aproximado; el chat real es contextual). */
export const RESPONSE_STYLE_PREVIEW = {
  brief: '«¿Qué fue lo más difícil hoy? Con una frase alcanza.»',
  balanced: '«Te leo. ¿Qué parte te pesa más en este momento?»',
  deep: '«A veces el cansancio trae una historia: ¿qué viene arrastrando esta sensación para ti?»',
  empatico:
    '«Tiene sentido que te sientas así; aquí puedes contarlo con calma.»',
  estructurado:
    '«1) Lo que notas 2) Lo que necesitas 3) Un paso pequeño. ¿Cuál es el 1 ahora?»',
};

/** Estilos ofrecidos en UI (se consolidaron similares: cálido→empático, profesional→estructurado, directo→breve). */
export const RESPONSE_STYLES = [
  'brief',
  'balanced',
  'deep',
  'empatico',
  'estructurado',
];

const LEGACY_RESPONSE_STYLE_MAP = {
  calido: 'empatico',
  profesional: 'estructurado',
  directo: 'brief',
};

/** Coincide con el default del backend y Joi en `userRoutes`. */
export const DEFAULT_RESPONSE_STYLE = 'balanced';

/**
 * Normaliza el valor persistido (legacy, espacios, datos corruptos) a una clave de UI válida.
 * @param {unknown} raw
 * @returns {typeof RESPONSE_STYLES[number]}
 */
export function normalizeResponseStyle(raw) {
  const key = typeof raw === 'string' ? raw.trim() : '';
  const mapped = LEGACY_RESPONSE_STYLE_MAP[key] || key;
  return RESPONSE_STYLES.includes(mapped) ? mapped : DEFAULT_RESPONSE_STYLE;
}
