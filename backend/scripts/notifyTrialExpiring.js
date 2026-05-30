/**
 * Script para enviar notificaciones de trial próximo a expirar
 * 
 * Este script verifica todos los usuarios en trial y envía notificaciones
 * push a aquellos cuyo trial expira pronto (ventana según APP_TRIAL_DAYS).
 * 
 * Uso:
 *   node backend/scripts/notifyTrialExpiring.js
 * 
 * Como cron job (ejecutar diariamente):
 *   0 9 * * * cd /path/to/project && node backend/scripts/notifyTrialExpiring.js
 * 
 * @author AntoApp Team
 */

import mongoose from 'mongoose';
import config from '../config/config.js';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import trialNotificationService from '../services/trialNotificationService.js';

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

const notifyTrialExpiring = async () => {
  try {
    console.log('🔔 Iniciando verificación de trials próximos a expirar...\n');

    const now = new Date();
    const users = await User.find({
      'subscription.status': 'trial',
      'subscription.trialEndDate': { $exists: true, $gte: now }
    }).select('_id subscription pushToken email username');

    let notifiedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        const result = await trialNotificationService.checkAndNotifyTrialExpiration(user._id.toString());
        
        if (result.success && result.notified) {
          notifiedCount++;
          console.log(`✅ Notificación enviada a ${user.email || user.username}: ${result.daysRemaining} día(s) restantes`);
        } else if (result.success && !result.notified) {
          console.log(`ℹ️  Usuario ${user.email || user.username}: ${result.daysRemaining} días restantes (no requiere notificación aún)`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error procesando usuario ${user.email || user.username}:`, error.message);
      }
    }

    // También verificar en modelo Subscription
    const subscriptions = await Subscription.find({
      status: 'trialing',
      trialEnd: { $exists: true, $gte: now }
    }).populate('userId', 'email username pushToken');

    for (const subscription of subscriptions) {
      if (!subscription.userId) continue;
      
      try {
        const result = await trialNotificationService.checkAndNotifyTrialExpiration(subscription.userId._id.toString());
        
        if (result.success && result.notified) {
          notifiedCount++;
          console.log(`✅ Notificación enviada a ${subscription.userId.email || subscription.userId.username}: ${result.daysRemaining} día(s) restantes`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Error procesando suscripción de usuario ${subscription.userId.email || subscription.userId.username}:`, error.message);
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`   - Notificaciones enviadas: ${notifiedCount}`);
    console.log(`   - Errores: ${errorCount}`);
    console.log(`   - Total procesado: ${users.length + subscriptions.length}`);

  } catch (error) {
    console.error('❌ Error en el proceso:', error);
    process.exit(1);
  }
};

const main = async () => {
  await connectDB();
  await notifyTrialExpiring();
  await mongoose.connection.close();
  console.log('\n✅ Proceso completado');
  process.exit(0);
};

main();

