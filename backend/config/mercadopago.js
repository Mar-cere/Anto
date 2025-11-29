/**
 * Configuración de Mercado Pago
 * 
 * Inicializa y configura el cliente de Mercado Pago con las credenciales
 * del entorno. Maneja tanto el modo de desarrollo como producción.
 * 
 * @author AntoApp Team
 */

import { MercadoPagoConfig, Preference, Subscription } from 'mercadopago';
import dotenv from 'dotenv';

dotenv.config();

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
export const subscriptionClient = new Subscription(client);

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
  prices: {
    monthly: parseInt(process.env.MERCADOPAGO_PRICE_MONTHLY || '9990', 10), // $9.990 CLP
    yearly: parseInt(process.env.MERCADOPAGO_PRICE_YEARLY || '79990', 10), // $79.990 CLP
  },
  
  // Configuración de trial (días)
  trialDays: parseInt(process.env.MERCADOPAGO_TRIAL_DAYS || '21', 10),
  
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

