/**
 * Constantes de la pantalla de Suscripción (SubscriptionScreen y subcomponentes).
 * @author AntoApp Team
 */

import { colors } from '../../styles/globalStyles';

export const LEGAL_URLS = {
  TERMS_EULA: 'https://www.antoapps.com/terminos',
  PRIVACY: 'https://www.antoapps.com/privacidad',
};

export const TEXTS = {
  TITLE: 'Suscripción Premium',
  SUBTITLE: 'Todos los planes incluyen el servicio completo. Elige la duración que prefieras.',
  CURRENT_SUBSCRIPTION: 'Tu Suscripción',
  AVAILABLE_PLANS: 'Planes Disponibles',
  LOADING: 'Cargando planes...',
  ERROR: 'Error al cargar los planes',
  RETRY: 'Reintentar',
  SUBSCRIBING: 'Procesando...',
  SUBSCRIBE_ERROR: 'Error al procesar la suscripción',
  OPENING_PAYMENT: 'Abriendo página de pago...',
  CANCEL_SUBSCRIPTION: 'Cancelar Suscripción',
  CANCEL_CONFIRM: '¿Estás seguro de que deseas cancelar tu suscripción?',
  CANCEL_SUCCESS: 'Suscripción cancelada exitosamente',
  CANCEL_ERROR: 'Error al cancelar la suscripción',
  NO_PLANS: 'No hay planes disponibles en este momento',
  LEGAL_TITLE: 'Términos y Política de Privacidad',
  TERMS_EULA_LABEL: 'Términos de Uso (EULA)',
  PRIVACY_LABEL: 'Política de Privacidad',
  SUBSCRIBE_AGREEMENT: 'Al suscribirte aceptas nuestros ',
  SUBSCRIBE_AGREEMENT_TERMS: 'Términos de Uso (EULA)',
  SUBSCRIBE_AGREEMENT_AND: ' y ',
  SUBSCRIBE_AGREEMENT_PRIVACY: 'Política de Privacidad',
  SUBSCRIBE_AGREEMENT_END: '.',
};

export const HARDCODED_PLANS = [
  { id: 'monthly', name: 'Premium Mensual', amount: 3990, formattedAmount: '$3.990', interval: 'month', currency: 'CLP', features: ['Servicio completo incluido'] },
  { id: 'quarterly', name: 'Premium Trimestral', amount: 11990, formattedAmount: '$11.990', interval: 'quarter', currency: 'CLP', features: ['Servicio completo incluido'] },
  { id: 'semestral', name: 'Premium Semestral', amount: 20990, formattedAmount: '$20.990', interval: 'semester', currency: 'CLP', features: ['Servicio completo incluido'] },
  { id: 'yearly', name: 'Premium Anual', amount: 39990, formattedAmount: '$39.990', interval: 'year', currency: 'CLP', features: ['Servicio completo incluido'] },
];

export const PLAN_ORDER = { monthly: 1, quarterly: 2, semestral: 3, yearly: 4 };

export const COLORS = {
  background: colors.background,
  primary: colors.primary,
  white: colors.white,
  textSecondary: colors.textSecondary,
  error: colors.error,
  cardBackground: colors.cardBackground,
};
