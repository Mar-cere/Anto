/**
 * Constantes de la pantalla de Suscripción (SubscriptionScreen y subcomponentes).
 * @author AntoApp Team
 */

import { useMemo } from 'react';
import { lightColors as legacyColors } from '../../styles/themePalettes';
import { useSectionTranslations } from '../../hooks/useTranslations';

export const LEGAL_URLS = {
  TERMS_EULA: 'https://www.antoapps.com/terminos',
  PRIVACY: 'https://www.antoapps.com/privacidad',
};

export const DEFAULT_TEXTS = {
  TITLE: 'Suscripción Premium',
  SUBTITLE: 'Todos los planes incluyen el servicio completo. Elige la duración que prefieras.',
  CURRENT_SUBSCRIPTION: 'Tu Suscripción',
  AVAILABLE_PLANS: 'Planes Disponibles',
  LOADING: 'Cargando planes...',
  ERROR: 'Error al cargar los planes',
  RETRY: 'Reintentar',
  LINK_OPEN_ERROR: 'No se pudo abrir el enlace',
  SUBSCRIBING: 'Procesando...',
  SUBSCRIBE_ERROR: 'Error al procesar la suscripción',
  OPENING_PAYMENT: 'Abriendo página de pago...',
  INVALID_PAYMENT_URL: 'La URL de pago no es válida.',
  CANCEL_SUBSCRIPTION: 'Cancelar Suscripción',
  CANCEL_CONFIRM: '¿Estás seguro de que deseas cancelar tu suscripción?',
  CANCEL_SUCCESS: 'Suscripción cancelada exitosamente',
  CANCEL_ERROR: 'Error al cancelar la suscripción',
  CANCEL_TRIAL_NO_PAID:
    'Estás en el periodo de prueba. No hay una suscripción de pago que cancelar; el acceso termina automáticamente al finalizar la prueba.',
  CANCEL_VIA_APP_STORE:
    'Tu suscripción se gestiona con App Store. Cancélala desde Ajustes de Apple > tu nombre > Suscripciones.',
  CANCEL_NOT_FOUND: 'No encontramos una suscripción de pago activa para cancelar.',
  CANCEL_NOT_CANCELLABLE:
    'No se puede cancelar esta suscripción desde la app. Si pagaste con App Store, adminístrala desde tu cuenta de Apple.',
  MANAGE_APP_STORE_SUBSCRIPTION: 'Administrar en App Store',
  MANAGE_APP_STORE_TITLE: 'Administrar suscripción',
  MANAGE_APP_STORE_MESSAGE:
    'Las suscripciones de iOS se cancelan desde App Store. Te llevaremos a tus suscripciones de Apple.',
  MANAGE_APP_STORE_OPEN: 'Abrir App Store',
  NO_PLANS: 'No hay planes disponibles en este momento',
  LEGAL_TITLE: 'Términos y Política de Privacidad',
  TERMS_EULA_LABEL: 'Términos de Uso (EULA)',
  PRIVACY_LABEL: 'Política de Privacidad',
  SUBSCRIBE_AGREEMENT: 'Al suscribirte aceptas nuestros ',
  SUBSCRIBE_AGREEMENT_TERMS: 'Términos de Uso (EULA)',
  SUBSCRIBE_AGREEMENT_AND: ' y ',
  SUBSCRIBE_AGREEMENT_PRIVACY: 'Política de Privacidad',
  SUBSCRIBE_AGREEMENT_END: '.',
  RESTORING_PURCHASES: 'Restaurando...',
  RESTORE_PURCHASES: 'Restaurar Compras',
  INFO_TEXT_IOS:
    'Los pagos se procesan de forma segura a través de App Store. Puedes cancelar tu suscripción en cualquier momento desde Configuración de Apple.',
  INFO_TEXT_ANDROID:
    'Todos los pagos son procesados de forma segura por Mercado Pago. Puedes cancelar tu suscripción en cualquier momento.',
  PAYMENT_VERIFIED_ACTIVE: 'Tu suscripción fue validada y activada.',
  PAYMENT_RETURN_VALIDATING:
    'Detectamos el retorno de pago. Estamos validando tu suscripción; revisa de nuevo en unos segundos.',
  PAYMENT_CANCELLED_RETRY:
    'Cancelaste el pago. Puedes intentarlo nuevamente cuando quieras.',
  INVALID_PLAN: 'Plan no válido. Vuelve a elegir un plan.',
  PLAN_UNKNOWN: 'desconocido',
  ALREADY_ACTIVE_WITH_DAYS:
    'Ya tienes {plan} activa ({days} día(s)). Puedes elegir otro plan o volver atrás.',
  ALREADY_ACTIVE_NO_DAYS: 'Ya tienes {plan} activa. Puedes elegir otro plan si lo necesitas.',
  APPSTORE_CONNECT_ERROR: 'No se pudo conectar con App Store.',
  APPSTORE_BUILD_HINT:
    'Usa un build nativo (no Expo Go) e inicia sesión con una cuenta Sandbox en Ajustes > App Store.',
  STORE_PRODUCTS_LOAD_ERROR:
    'No se pudieron cargar los productos de la tienda.',
  SUBSCRIPTION_ACTIVATED: '¡Suscripción activada correctamente!',
  SUBSCRIPTION_ALREADY_ACTIVE: 'Tu suscripción ya estaba activa. Estado actualizado.',
  SUBSCRIPTION_GENERIC_ERROR: 'Ocurrió un error al procesar tu suscripción',
  SUBSCRIPTION_VALIDATION_NETWORK:
    'No se pudo conectar con el servidor para validar tu compra. Verifica tu conexión e intenta de nuevo.',
  SUBSCRIPTION_VALIDATION_ERROR:
    'Hubo un problema al validar tu compra. Intenta de nuevo o contacta soporte.',
  SUBSCRIPTION_PRODUCT_UNAVAILABLE:
    'El producto no está disponible en este momento. Intenta más tarde.',
  SUBSCRIPTION_APPSTORE_UNAVAILABLE:
    'No se pudo conectar con App Store. Verifica tu conexión e intenta de nuevo.',
  SUBSCRIPTION_TECH_ERROR: 'Error técnico. Reinicia la app e intenta de nuevo.',
  SUBSCRIPTION_UNEXPECTED_ERROR:
    'Ocurrió un error inesperado al suscribirte.',
  IOS_NO_IAP_BUILD:
    'En iOS las suscripciones se pagan con App Store. Esta instalación no tiene compras in-app (por ejemplo Expo Go o un binario sin IAP). Instala desde TestFlight o recompila con expo-in-app-purchases. En Android se usa Mercado Pago.',
  CHECKOUT_SESSION_ERROR: 'No se pudo crear la sesión de pago.',
  CHECKOUT_URL_INVALID: 'No se recibió una URL válida para el pago.',
  MERCADOPAGO_OPENED_BROWSER:
    'Se abrió Mercado Pago en tu navegador. Cuando termines, vuelve a la app.',
  SUBSCRIPTION_PROCESS_ERROR:
    'Ocurrió un error al procesar tu suscripción.',
  CANCEL_CONFIRM_SUFFIX:
    '\n\nTu suscripción seguirá activa hasta el final del período actual.',
  CANCEL_NO: 'No',
  CANCEL_YES: 'Sí, cancelar',
  CANCELLED_PERIOD_END:
    'Suscripción cancelada. Seguirás teniendo acceso hasta el final del período actual.',
  CHEAPER_PLAN_TITLE: '¿Cambiar a un plan más económico?',
  CHEAPER_PLAN_MESSAGE_PREFIX:
    'Antes de cancelar, ¿te gustaría cambiar a uno de estos planes?',
  CHEAPER_PLAN_MESSAGE_SUFFIX: 'O puedes cancelar completamente.',
  CHEAPER_PLAN_VIEW: 'Ver planes más baratos',
  CHEAPER_PLAN_PICK_TITLE: 'Planes más económicos',
  CHEAPER_PLAN_PICK_MESSAGE: 'Selecciona el plan:',
  CANCEL_SUBSCRIPTION_ACTION: 'Cancelar suscripción',
  BACK: 'Volver',
  RESTORE_IOS_ONLY:
    'La restauración de compras solo está disponible en iOS con la app instalada desde la tienda.',
  RESTORE_SUCCESS_COUNT: 'Se restauraron {count} compra(s).',
  RESTORE_NONE:
    'No se encontraron compras de esta cuenta para restaurar.',
  RESTORE_CANCELLED: 'Restauración cancelada por el usuario.',
  RESTORE_ERROR: 'No se pudieron restaurar las compras.',
  RESTORE_GENERIC_ERROR:
    'Ocurrió un error al restaurar las compras.',
  PAYMENT_SUCCESS_TOAST: 'Tu suscripción ha sido activada correctamente.',
  PAYMENT_CANCEL_TOAST:
    'El pago fue cancelado. Puedes intentar nuevamente cuando lo desees.',
  PAYMENT_ERROR_TOAST:
    'Ocurrió un error durante el proceso de pago.',
  PAYMENT_CLOSE_A11Y: 'Cerrar',
  PAYMENT_HEADER_TITLE: 'Pago con Mercado Pago',
  PAYMENT_LOADING: 'Cargando página de pago...',
  PAYMENT_LOADING_SECURE: 'Procesando tu pago de forma segura...',
  PAYMENT_ERROR: 'Error al cargar el pago',
  PAYMENT_ERROR_TITLE: 'Error',
  PAYMENT_ERROR_NO_VALID_URL: 'No se proporcionó una URL válida',
  PAYMENT_ERROR_INVALID_URL_PROTOCOL:
    'URL inválida. Debe comenzar con http:// o https://',
  PAYMENT_ERROR_INVALID_URL: 'URL inválida',
  PAYMENT_ERROR_PROCESS: 'Error en el proceso de pago',
  PAYMENT_ERROR_HTTP_PAGE: 'Error al cargar la página ({statusCode})',
  PAYMENT_ERROR_BROWSER_OPEN: 'No se pudo abrir el navegador',
  PAYMENT_ERROR_CONNECTION:
    'Error de conexión. Verifica tu conexión a internet.',
  PAYMENT_ERROR_TIMEOUT:
    'Tiempo de espera agotado. Por favor, intenta nuevamente.',
  PAYMENT_ERROR_MERCADOPAGO_APP:
    'No se pudo conectar con Mercado Pago en la app. Te recomendamos usar el navegador externo.',
  PAYMENT_OPEN_BROWSER: 'Abrir en navegador',
  PAYMENT_SECURE_LABEL: 'Pago seguro con Mercado Pago',
  PAYMENT_PROCESSING: 'Procesando...',
  PLAN_NAME_MONTHLY: 'Premium Mensual',
  PLAN_NAME_QUARTERLY: 'Premium Trimestral',
  PLAN_NAME_SEMESTRAL: 'Premium Semestral',
  PLAN_NAME_YEARLY: 'Premium Anual',
  PAYWALL_HEADLINE: 'Anto te estuvo acompañando hoy.',
  PAYWALL_SUBHEADLINE: 'Sigue construyendo tu bienestar desde mañana.',
  PAYWALL_MEMORY_TODAY_PREFIX: 'Hoy ',
  PAYWALL_MEMORY_FIRST_CHECKIN: 'completaste tu primer check-in',
  PAYWALL_MEMORY_CHECKIN_TODAY: 'completaste tu check-in',
  PAYWALL_MEMORY_HABITS_ONE: 'empezaste 1 hábito nuevo',
  PAYWALL_MEMORY_HABITS_MANY: 'empezaste {count} hábitos nuevos',
  PAYWALL_MEMORY_TASKS_ONE: 'completaste 1 tarea',
  PAYWALL_MEMORY_TASKS_MANY: 'completaste {count} tareas',
  PAYWALL_MEMORY_CHAT_ONE: 'enviaste 1 mensaje en el chat',
  PAYWALL_MEMORY_CHAT_MANY: 'enviaste {count} mensajes en el chat',
  PAYWALL_MEMORY_JOINER: ' y ',
  PAYWALL_MEMORY_OUTRO: 'Eso no se pierde — te esperamos mañana.',
  PAYWALL_MEMORY_FALLBACK:
    'Hoy diste un paso con Anto. Tu progreso sigue aquí cuando quieras retomarlo.',
  PAYWALL_CHOOSE_PLAN: 'Elige tu plan',
  PAYWALL_BEST_VALUE: 'Mejor valor',
  PAYWALL_DURATION_YEAR: '1 año',
  PAYWALL_DURATION_SEMESTER: '6 meses',
  PAYWALL_DURATION_QUARTER: '3 meses',
  PAYWALL_DURATION_MONTH: '1 mes',
  PAYWALL_PER_MONTH: '/mes',
  PAYWALL_VS_MONTHLY: 'vs {price}/mes si pagas mensual',
  PAYWALL_VS_MONTHLY_SHORT: 'vs {price}/mes',
  PAYWALL_SAVE_PERCENT: 'Ahorras {percent}%',
  PAYWALL_BADGE_POPULAR: 'Popular',
  PAYWALL_CTA: 'Continuar con Anto',
  PAYWALL_BENEFIT_1: 'Chat ilimitado con Anto',
  PAYWALL_BENEFIT_2: 'Hábitos, técnicas y seguimiento emocional',
  PAYWALL_BENEFIT_3: 'Historial y patrones de bienestar',
};

/** Compatibilidad legacy */
export const TEXTS = DEFAULT_TEXTS;

export function useSubscriptionTexts() {
  const translated = useSectionTranslations('SUBSCRIPTION');
  return useMemo(() => ({ ...DEFAULT_TEXTS, ...(translated || {}) }), [translated]);
}

export const HARDCODED_PLANS = [
  { id: 'monthly', name: 'Premium Mensual', amount: 3990, formattedAmount: '$3.990', interval: 'month', currency: 'CLP', features: [] },
  { id: 'quarterly', name: 'Premium Trimestral', amount: 11990, formattedAmount: '$11.990', interval: 'quarter', currency: 'CLP', features: [] },
  { id: 'semestral', name: 'Premium Semestral', amount: 20990, formattedAmount: '$20.990', interval: 'semester', currency: 'CLP', features: [] },
  { id: 'yearly', name: 'Premium Anual', amount: 39990, formattedAmount: '$39.990', interval: 'year', currency: 'CLP', features: [] },
];

export const PLAN_ORDER = { monthly: 1, quarterly: 2, semestral: 3, yearly: 4 };

/**
 * Export legacy usado por tests antiguos.
 * En UI usar useTheme().colors.
 */
export function createSubscriptionColors(colors) {
  return {
    background: colors.background,
    primary: colors.primary,
    white: colors.white,
    textSecondary: colors.textSecondary,
    error: colors.error,
    cardBackground: colors.cardBackground ?? colors.surface,
  };
}

/** Compatibilidad legacy (tests/archivos no migrados) */
export const COLORS = createSubscriptionColors(legacyColors);
