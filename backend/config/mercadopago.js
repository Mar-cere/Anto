/**
 * Configuración de Mercado Pago
 * 
 * Inicializa y configura el cliente de Mercado Pago con las credenciales
 * del entorno. Maneja tanto el modo de desarrollo como producción.
 * 
 * @author AntoApp Team
 */

// Importar Mercado Pago SDK (CommonJS module)
import dotenv from 'dotenv';
import mercadopago from 'mercadopago';

dotenv.config();

// Desestructurar las clases del SDK
const { MercadoPagoConfig, Preference, PreApproval, PreApprovalPlan } = mercadopago;

// Validar que exista el access token de Mercado Pago
if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  console.warn('⚠️  MERCADOPAGO_ACCESS_TOKEN no está configurado en las variables de entorno');
  console.warn('⚠️  El sistema de pagos no funcionará correctamente');
}

// Inicializar cliente de Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  options: {
    timeout: 5000,
    idempotencyKey: 'abc',
  },
});

// Clientes para diferentes recursos
export const preferenceClient = new Preference(client);
export const preapprovalClient = new PreApproval(client);
export const preapprovalPlanClient = new PreApprovalPlan(client);

// Constantes de configuración
export const MERCADOPAGO_CONFIG = {
  // Modo (test o production)
  mode: process.env.MERCADOPAGO_ACCESS_TOKEN?.startsWith('TEST-') ? 'test' : 'production',
  
  // Webhook secret para validar notificaciones
  webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || '',
  
  // URLs de éxito y cancelación
  successUrl: process.env.MERCADOPAGO_SUCCESS_URL || 'http://localhost:3000/subscription/success',
  cancelUrl: process.env.MERCADOPAGO_CANCEL_URL || 'http://localhost:3000/subscription/cancel',
  pendingUrl: process.env.MERCADOPAGO_PENDING_URL || 'http://localhost:3000/subscription/pending',
  
  // Precios de los planes (en pesos chilenos)
  // Descuento máximo: 15% anual
  // Descuentos graduales progresivos: 5% (mensual) → 3% → 5.5% → 15%
  prices: {
    weekly: parseInt(process.env.MERCADOPAGO_PRICE_WEEKLY || '1300', 10), // $1,300 CLP
    monthly: parseInt(process.env.MERCADOPAGO_PRICE_MONTHLY || '5348', 10), // $5,348 CLP (5% descuento vs semanal: $1,300 × 4.33 × 0.95)
    quarterly: parseInt(process.env.MERCADOPAGO_PRICE_QUARTERLY || '15562', 10), // $15,562 CLP (3% descuento vs mensual)
    semestral: parseInt(process.env.MERCADOPAGO_PRICE_SEMESTRAL || '30324', 10), // $30,324 CLP (5.5% descuento vs mensual)
    yearly: parseInt(process.env.MERCADOPAGO_PRICE_YEARLY || '54549', 10), // $54,549 CLP (15% descuento vs mensual - máximo)
  },
  
  // IDs de Preapproval Plans (creados en el panel de Mercado Pago)
  preapprovalPlanIds: {
    weekly: process.env.MERCADOPAGO_PREAPPROVAL_PLAN_ID_WEEKLY || '',
    monthly: process.env.MERCADOPAGO_PREAPPROVAL_PLAN_ID_MONTHLY || '',
    quarterly: process.env.MERCADOPAGO_PREAPPROVAL_PLAN_ID_QUARTERLY || '',
    semestral: process.env.MERCADOPAGO_PREAPPROVAL_PLAN_ID_SEMESTRAL || '',
    yearly: process.env.MERCADOPAGO_PREAPPROVAL_PLAN_ID_YEARLY || '',
  },
  
  // Configuración de trial (días)
  trialDays: parseInt(process.env.MERCADOPAGO_TRIAL_DAYS || '3', 10),
  
  // Moneda
  currency: process.env.MERCADOPAGO_CURRENCY || 'CLP',
};

// Validar configuración
if (MERCADOPAGO_CONFIG.mode === 'test' && !process.env.MERCADOPAGO_ACCESS_TOKEN?.startsWith('TEST-')) {
  console.warn('⚠️  Se detectó un access token de Mercado Pago que no es de prueba');
}

// Exportar cliente principal
export default client;

// Helper: verificar si Mercado Pago está configurado
export const isMercadoPagoConfigured = () => {
  return !!process.env.MERCADOPAGO_ACCESS_TOKEN;
};

// Helper: obtener el precio según el plan
export const getPlanPrice = (plan) => {
  return MERCADOPAGO_CONFIG.prices[plan] || 0;
};

// Helper: obtener el ID del Preapproval Plan según el plan
export const getPreapprovalPlanId = (plan) => {
  return MERCADOPAGO_CONFIG.preapprovalPlanIds[plan] || null;
};

// Helper: generar URL de checkout para Preapproval Plan
export const getPreapprovalCheckoutUrl = (planId) => {
  if (!planId) return null;
  return `https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=${planId}`;
};

// Helper: formatear monto para mostrar
export const formatAmount = (amount, currency = 'CLP') => {
  if (currency === 'CLP') {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount / 100);
};

// Helper: convertir CLP a centavos (para compatibilidad)
export const clpToCents = (clp) => {
  return Math.round(clp * 100);
};

// Helper: convertir centavos a CLP
export const centsToClp = (cents) => {
  return Math.round(cents / 100);
};

