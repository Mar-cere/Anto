/**
 * Script de Verificación de Expiración de Trial
 * 
 * Este script verifica los trials próximos a expirar y envía notificaciones.
 * 
 * Uso:
 *   node backend/scripts/checkTrialExpiration.js
 * 
 * O configurar como cron job (diario):
 *   0 9 * * * cd /path/to/project && node backend/scripts/checkTrialExpiration.js
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
import trialNotificationService from '../services/trialNotificationService.js';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import config from '../config/config.js';

/**
 * Función principal
 */
async function main() {
  try {
    console.log('🔄 Verificando trials próximos a expirar...');
    console.log(`📅 Fecha: ${new Date().toISOString()}`);
    console.log('');

    // Conectar a MongoDB
    await mongoose.connect(config.database.uri);
    console.log('✅ Conectado a MongoDB');

    // Buscar usuarios en trial
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(now);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    // Usuarios en trial que expiran en los próximos días (ventana corta; p. ej. trial de 1 día)
    const usersInTrial = await User.find({
      'subscription.status': 'trial',
      'subscription.trialEndDate': {
        $gte: now,
        $lte: dayAfterTomorrow,
      },
    }).select('_id email username subscription');

    // Suscripciones en trial que expiran en los próximos días
    const subscriptionsInTrial = await Subscription.find({
      status: 'trialing',
      trialEnd: {
        $gte: now,
        $lte: dayAfterTomorrow,
      },
    }).populate('userId', 'email username');

    console.log(`📊 Usuarios en trial próximos a expirar: ${usersInTrial.length + subscriptionsInTrial.length}`);
    console.log('');

    let notifiedCount = 0;
    let errorCount = 0;

    // Procesar usuarios del modelo User
    for (const user of usersInTrial) {
      try {
        const result = await trialNotificationService.checkAndNotifyTrialExpiration(user._id.toString());
        if (result.success && result.notified) {
          notifiedCount++;
          console.log(`✅ Notificado: ${user.email} - ${result.daysRemaining} día(s) restantes`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error procesando usuario ${user.email}:`, error.message);
      }
    }

    // Procesar suscripciones del modelo Subscription
    for (const subscription of subscriptionsInTrial) {
      if (!subscription.userId) continue;
      
      try {
        const result = await trialNotificationService.checkAndNotifyTrialExpiration(
          subscription.userId._id.toString()
        );
        if (result.success && result.notified) {
          notifiedCount++;
          console.log(`✅ Notificado: ${subscription.userId.email} - ${result.daysRemaining} día(s) restantes`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error procesando suscripción ${subscription.userId.email}:`, error.message);
      }
    }

    // Verificar y actualizar trials expirados
    console.log('');
    console.log('🔄 Verificando trials expirados...');
    
    const expiredUsers = await User.find({
      'subscription.status': 'trial',
      'subscription.trialEndDate': { $lt: now },
    }).select('_id');

    const expiredSubscriptions = await Subscription.find({
      status: 'trialing',
      trialEnd: { $lt: now },
    }).select('userId');

    let updatedCount = 0;

    for (const user of expiredUsers) {
      try {
        const result = await trialNotificationService.checkAndUpdateExpiredTrial(user._id.toString());
        if (result.success && result.updated) {
          updatedCount++;
        }
      } catch (error) {
        console.error(`❌ Error actualizando trial expirado para usuario ${user._id}:`, error.message);
      }
    }

    for (const subscription of expiredSubscriptions) {
      if (!subscription.userId) continue;
      
      try {
        const result = await trialNotificationService.checkAndUpdateExpiredTrial(
          subscription.userId.toString()
        );
        if (result.success && result.updated) {
          updatedCount++;
        }
      } catch (error) {
        console.error(`❌ Error actualizando suscripción expirada:`, error.message);
      }
    }

    console.log('');
    console.log('📊 Resumen:');
    console.log(`   Notificaciones enviadas: ${notifiedCount}`);
    console.log(`   Trials actualizados: ${updatedCount}`);
    console.log(`   Errores: ${errorCount}`);
    console.log('');
    console.log('✅ Proceso completado');

    // Cerrar conexión
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en verificación de trials:', error);
    process.exit(1);
  }
}

// Ejecutar
main();

