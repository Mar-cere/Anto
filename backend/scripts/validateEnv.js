/**
 * Script de Validación de Variables de Entorno
 * 
 * Valida que todas las variables de entorno requeridas estén configuradas.
 * 
 * Uso:
 *   node backend/scripts/validateEnv.js
 * 
 * @author AntoApp Team
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar rutas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Variables requeridas
const REQUIRED_VARS = {
  'MONGO_URI': 'URI de conexión a MongoDB',
  'JWT_SECRET': 'Secret para firmar tokens JWT',
  'OPENAI_API_KEY': 'API Key de OpenAI',
};

// Variables opcionales pero recomendadas
const RECOMMENDED_VARS = {
  'MERCADOPAGO_ACCESS_TOKEN': 'Token de acceso de Mercado Pago (requerido para pagos)',
  'MERCADOPAGO_WEBHOOK_SECRET': 'Secreto del panel de webhooks MP (recomendado en producción para HMAC)',
  'MERCADOPAGO_SUBSCRIPTIONS_CHECKOUT_BACK_URL': 'URL HTTPS de retorno tras suscripción (opcional; debe coincidir con la app en MP; si no, dejar vacío y usar solo el panel MP)',
  'SENDGRID_API_KEY': 'API Key de SendGrid (requerido para emails)',
  'TWILIO_ACCOUNT_SID': 'Account SID de Twilio (requerido para WhatsApp)',
  'TWILIO_AUTH_TOKEN': 'Auth Token de Twilio (requerido para WhatsApp)',
  'FRONTEND_URL': 'URL del frontend (requerido en producción)',
};

// Variables opcionales
const OPTIONAL_VARS = {
  'CLOUDINARY_CLOUD_NAME': 'Cloud name de Cloudinary (opcional, para avatares)',
  'CLOUDINARY_API_KEY': 'API Key de Cloudinary (opcional)',
  'CLOUDINARY_API_SECRET': 'API Secret de Cloudinary (opcional)',
  'SENTRY_DSN': 'DSN de Sentry (opcional, para error tracking)',
};

// Variables opcionales 1.4.4 (release Bloque A)
const RELEASE_1_4_4_VARS = {
  WEEKLY_INSIGHT_LLM_ENABLED: 'Narrativa LLM en informes semanal/mensual',
  ATLAS_VECTOR_SEARCH_ENABLED: 'Búsqueda vectorial topicFree en Atlas',
  ATLAS_TOPIC_FREE_VECTOR_INDEX: 'Nombre del índice vectorial en Atlas',
  TOPIC_FREE_EMBEDDINGS_ENABLED: 'Embeddings topicFree para grafo semántico',
};

// Variables opcionales 1.5.0 (Bloque D)
const RELEASE_1_5_0_VARS = {
  PERSONAL_PATTERN_RAG_ENABLED: 'RAG patrones personales (embeddings; consent Memoria del proceso; Atlas opcional)',
  ENABLE_CRISIS_HARD_STOP: 'Hard-stop sin LLM en crisis HIGH explícita',
};

let hasErrors = false;
let hasReleaseHints = false;
let hasRelease15Hints = false;
let hasWarnings = false;

console.log('🔍 Validando variables de entorno...\n');

// Validar variables requeridas
console.log('📋 Variables Requeridas:');
for (const [key, description] of Object.entries(REQUIRED_VARS)) {
  if (process.env[key]) {
    // Ocultar valores sensibles
    const value = key.includes('SECRET') || key.includes('KEY') || key.includes('TOKEN')
      ? '***' + process.env[key].slice(-4)
      : process.env[key];
    console.log(`  ✅ ${key}: ${value} (${description})`);
  } else {
    console.log(`  ❌ ${key}: NO CONFIGURADA (${description})`);
    hasErrors = true;
  }
}

console.log('\n📋 Variables Recomendadas:');
for (const [key, description] of Object.entries(RECOMMENDED_VARS)) {
  if (process.env[key]) {
    const value = key.includes('SECRET') || key.includes('KEY') || key.includes('TOKEN')
      ? '***' + process.env[key].slice(-4)
      : process.env[key];
    console.log(`  ✅ ${key}: ${value} (${description})`);
  } else {
    console.log(`  ⚠️  ${key}: NO CONFIGURADA (${description})`);
    hasWarnings = true;
  }
}

console.log('\n📋 Variables Opcionales:');
let optionalCount = 0;
for (const [key, description] of Object.entries(OPTIONAL_VARS)) {
  if (process.env[key]) {
    const value = key.includes('SECRET') || key.includes('KEY')
      ? '***' + process.env[key].slice(-4)
      : process.env[key];
    console.log(`  ✅ ${key}: ${value} (${description})`);
    optionalCount++;
  }
}
if (optionalCount === 0) {
  console.log('  ℹ️  Ninguna variable opcional configurada');
}

if (process.env.NODE_ENV === 'production') {
  console.log('\n📋 Release 1.4.4 (recomendado en producción):');
  for (const [key, description] of Object.entries(RELEASE_1_4_4_VARS)) {
    if (process.env[key]) {
      console.log(`  ✅ ${key} (${description})`);
    } else {
      console.log(`  ⚠️  ${key}: NO CONFIGURADA (${description})`);
      hasReleaseHints = true;
    }
  }

  console.log('\n📋 Release 1.5.0 (Bloque D — chat):');
  for (const [key, description] of Object.entries(RELEASE_1_5_0_VARS)) {
    if (process.env[key]) {
      console.log(`  ✅ ${key} (${description})`);
    } else if (key === 'ENABLE_CRISIS_HARD_STOP') {
      console.log(`  ℹ️  ${key}: default activo si no se define`);
    } else {
      console.log(`  ⚠️  ${key}: NO CONFIGURADA (${description})`);
      hasRelease15Hints = true;
    }
  }

  if (process.env.PERSONAL_PATTERN_RAG_ENABLED === 'true') {
    const embeddingsOn =
      process.env.TOPIC_FREE_EMBEDDINGS_ENABLED !== 'false' && Boolean(process.env.OPENAI_API_KEY);
    if (!embeddingsOn) {
      console.log('  ⚠️  PERSONAL_PATTERN_RAG_ENABLED=true pero embeddings no disponibles');
      hasRelease15Hints = true;
    }
    if (process.env.ATLAS_VECTOR_SEARCH_ENABLED !== 'true') {
      console.log('  ℹ️  PERSONAL_PATTERN_RAG usará fallback scan (sin ATLAS_VECTOR_SEARCH_ENABLED=true)');
    }
  }
}

// Validaciones adicionales
console.log('\n🔍 Validaciones Adicionales:');

// Validar NODE_ENV
if (!process.env.NODE_ENV) {
  console.log('  ⚠️  NODE_ENV no configurada, usando "development" por defecto');
  hasWarnings = true;
} else {
  console.log(`  ✅ NODE_ENV: ${process.env.NODE_ENV}`);
}

// Validar formato de MONGO_URI
if (process.env.MONGO_URI) {
  if (process.env.MONGO_URI.includes('localhost') && process.env.NODE_ENV === 'production') {
    console.log('  ⚠️  MONGO_URI parece ser de desarrollo pero NODE_ENV es production');
    hasWarnings = true;
  } else {
    console.log('  ✅ MONGO_URI tiene formato válido');
  }
}

// Validar JWT_SECRET
if (process.env.JWT_SECRET) {
  if (process.env.JWT_SECRET.length < 32) {
    console.log('  ⚠️  JWT_SECRET es muy corto (recomendado: al menos 32 caracteres)');
    hasWarnings = true;
  } else {
    console.log('  ✅ JWT_SECRET tiene longitud adecuada');
  }
}

// Resumen
console.log('\n📊 Resumen:');
if (hasErrors) {
  console.log('  ❌ Hay errores críticos. Por favor, configura las variables requeridas.');
  process.exit(1);
} else if (hasWarnings || hasReleaseHints || hasRelease15Hints) {
  console.log('  ⚠️  Hay advertencias. Algunas funcionalidades pueden no estar disponibles.');
  if (hasReleaseHints) {
    console.log('  💡 Revisa variables de Release 1.4.4 para el despliegue completo.');
  }
  if (hasRelease15Hints) {
    console.log('  💡 Revisa variables de Release 1.5.0 (Bloque D).');
  } else if (!hasReleaseHints) {
    console.log('  💡 Revisa las variables recomendadas para habilitar todas las funcionalidades.');
  }
  process.exit(0);
} else {
  console.log('  ✅ Todas las validaciones pasaron correctamente.');
  process.exit(0);
}

