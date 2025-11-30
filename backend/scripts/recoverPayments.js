/**
 * Script de Recuperación Automática de Pagos
 * 
 * Este script detecta y recupera automáticamente pagos que fueron
 * completados pero no activaron suscripciones correctamente.
 * 
 * Uso:
 *   node backend/scripts/recoverPayments.js
 * 
 * O configurar como cron job:
 *   0 * * * * cd /path/to/project && node backend/scripts/recoverPayments.js
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

// Importar servicios y modelos
import paymentRecoveryService from '../services/paymentRecoveryService.js';
import paymentAuditService from '../services/paymentAuditService.js';
import config from '../config/config.js';

// Configuración
const DRY_RUN = process.env.DRY_RUN === 'true'; // Si es true, solo muestra qué haría sin hacer cambios
const MAX_RECOVERY_AGE_DAYS = 7; // Solo recuperar pagos de los últimos 7 días

/**
 * Función principal
 */
async function main() {
  try {
    console.log('🔄 Iniciando recuperación automática de pagos...');
    console.log(`📅 Fecha: ${new Date().toISOString()}`);
    console.log(`🔧 Modo: ${DRY_RUN ? 'DRY RUN (solo lectura)' : 'EJECUCIÓN REAL'}`);
    console.log('');

    // Conectar a MongoDB
    await mongoose.connect(config.database.uri);
    console.log('✅ Conectado a MongoDB');

    // Buscar pagos no activados
    console.log('🔍 Buscando pagos no activados...');
    const unactivated = await paymentAuditService.findUnactivatedPayments();

    if (unactivated.length === 0) {
      console.log('✅ No se encontraron pagos no activados');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`⚠️  Se encontraron ${unactivated.length} pagos no activados:`);
    console.log('');

    // Filtrar por antigüedad
    const now = Date.now();
    const maxAge = MAX_RECOVERY_AGE_DAYS * 24 * 60 * 60 * 1000;
    const recentUnactivated = unactivated.filter(
      payment => (now - new Date(payment.completedAt).getTime()) <= maxAge
    );

    if (recentUnactivated.length === 0) {
      console.log(`ℹ️  Todos los pagos no activados son más antiguos de ${MAX_RECOVERY_AGE_DAYS} días`);
      console.log('   (Solo se procesan pagos recientes para evitar problemas)');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`📊 Pagos recientes a procesar: ${recentUnactivated.length}`);
    console.log('');

    // Mostrar detalles
    recentUnactivated.forEach((payment, index) => {
      console.log(`${index + 1}. Transacción: ${payment.transactionId}`);
      console.log(`   Usuario: ${payment.userEmail} (${payment.userName})`);
      console.log(`   Plan: ${payment.plan}`);
      console.log(`   Monto: $${payment.amount} CLP`);
      console.log(`   Completado hace: ${payment.daysSinceCompletion} días`);
      console.log('');
    });

    if (DRY_RUN) {
      console.log('🔍 MODO DRY RUN: No se realizarán cambios');
      console.log('   Para ejecutar realmente, establece DRY_RUN=false');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Procesar pagos
    console.log('🔄 Procesando pagos...');
    const results = await paymentRecoveryService.processUnactivatedPayments();

    console.log('');
    console.log('📊 Resultados:');
    console.log(`   Total: ${results.total}`);
    console.log(`   ✅ Exitosos: ${results.successful}`);
    console.log(`   ❌ Fallidos: ${results.failed}`);

    if (results.errors.length > 0) {
      console.log('');
      console.log('⚠️  Errores encontrados:');
      results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. Transacción ${error.transactionId}: ${error.error}`);
      });
    }

    // Registrar evento
    await paymentAuditService.logEvent('AUTOMATIC_RECOVERY_RUN', {
      total: results.total,
      successful: results.successful,
      failed: results.failed,
      errors: results.errors,
      dryRun: DRY_RUN,
    }, null);

    console.log('');
    console.log('✅ Proceso completado');

    // Cerrar conexión
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en recuperación automática:', error);
    
    // Registrar error
    try {
      await paymentAuditService.logEvent('AUTOMATIC_RECOVERY_ERROR', {
        error: error.message,
        stack: error.stack?.substring(0, 500),
      }, null);
    } catch (logError) {
      console.error('Error registrando evento:', logError);
    }

    process.exit(1);
  }
}

// Ejecutar
main();

