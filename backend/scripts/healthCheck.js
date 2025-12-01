/**
 * Health Check Script
 * 
 * Verifica el estado de salud del servidor y sus dependencias.
 * Útil para monitoreo y verificación rápida del sistema.
 * 
 * Uso:
 *   node backend/scripts/healthCheck.js
 * 
 * @author AntoApp Team
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar rutas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../../.env') });

import config from '../config/config.js';

const checks = {
  database: false,
  environment: false,
  requiredEnvVars: false,
};

let exitCode = 0;

/**
 * Verificar conexión a base de datos
 */
async function checkDatabase() {
  try {
    await mongoose.connect(config.database.uri, {
      serverSelectionTimeoutMS: 5000,
    });
    
    const state = mongoose.connection.readyState;
    if (state === 1) { // Connected
      checks.database = true;
      console.log('✅ Base de datos: Conectada');
      await mongoose.connection.close();
      return true;
    } else {
      console.log('❌ Base de datos: No conectada (estado:', state, ')');
      exitCode = 1;
      return false;
    }
  } catch (error) {
    console.log('❌ Base de datos: Error de conexión');
    console.log('   Error:', error.message);
    exitCode = 1;
    return false;
  }
}

/**
 * Verificar variables de entorno
 */
function checkEnvironment() {
  const required = [
    'MONGO_URI',
    'JWT_SECRET',
    'OPENAI_API_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length === 0) {
    checks.environment = true;
    console.log('✅ Variables de entorno: Todas configuradas');
    return true;
  } else {
    console.log('❌ Variables de entorno: Faltan variables');
    console.log('   Faltantes:', missing.join(', '));
    exitCode = 1;
    return false;
  }
}

/**
 * Verificar variables de entorno opcionales pero recomendadas
 */
function checkOptionalEnvVars() {
  const optional = {
    'MERCADOPAGO_ACCESS_TOKEN': 'Sistema de pagos',
    'SENDGRID_API_KEY': 'Envío de emails',
    'TWILIO_ACCOUNT_SID': 'WhatsApp',
  };

  const missing = [];
  for (const [key, description] of Object.entries(optional)) {
    if (!process.env[key]) {
      missing.push(`${key} (${description})`);
    }
  }

  if (missing.length === 0) {
    console.log('✅ Variables opcionales: Todas configuradas');
  } else {
    console.log('⚠️  Variables opcionales: Faltan algunas');
    console.log('   Faltantes:', missing.join(', '));
    console.log('   Nota: Estas son opcionales pero recomendadas');
  }
}

/**
 * Verificar configuración de producción
 */
function checkProductionConfig() {
  if (process.env.NODE_ENV === 'production') {
    console.log('📋 Verificando configuración de producción...');
    
    const productionChecks = {
      'FRONTEND_URL': 'URL del frontend',
      'MONGO_URI': 'URI de MongoDB (debe ser de producción)',
    };

    const issues = [];
    for (const [key, description] of Object.entries(productionChecks)) {
      if (!process.env[key]) {
        issues.push(`${key} (${description})`);
      } else if (key === 'MONGO_URI' && process.env[key].includes('localhost')) {
        issues.push(`${key} (parece ser de desarrollo, verificar)`);
      }
    }

    if (issues.length === 0) {
      console.log('✅ Configuración de producción: Correcta');
    } else {
      console.log('⚠️  Configuración de producción: Problemas detectados');
      console.log('   Problemas:', issues.join(', '));
    }
  } else {
    console.log('ℹ️  Modo desarrollo detectado');
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🏥 Health Check - Anto App');
  console.log('==========================\n');

  // Verificar variables de entorno
  checkEnvironment();
  checkOptionalEnvVars();
  checkProductionConfig();
  console.log('');

  // Verificar base de datos
  await checkDatabase();
  console.log('');

  // Resumen
  console.log('📊 Resumen:');
  console.log(`   Base de datos: ${checks.database ? '✅' : '❌'}`);
  console.log(`   Variables de entorno: ${checks.environment ? '✅' : '❌'}`);
  console.log('');

  if (exitCode === 0) {
    console.log('✅ Todos los checks críticos pasaron');
  } else {
    console.log('❌ Algunos checks fallaron');
  }

  process.exit(exitCode);
}

// Ejecutar
main();

