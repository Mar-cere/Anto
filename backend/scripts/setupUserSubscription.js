/**
 * Script para configurar suscripción de usuario (Trial o Premium)
 * 
 * Uso:
 *   node scripts/setupUserSubscription.js <email|username> <trial|premium> [días]
 * 
 * Ejemplos:
 *   node scripts/setupUserSubscription.js usuario@ejemplo.com trial 21
 *   node scripts/setupUserSubscription.js usuario@ejemplo.com premium monthly
 *   node scripts/setupUserSubscription.js usuario@ejemplo.com premium yearly
 */

import mongoose from 'mongoose';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import config from '../config/config.js';

// Conectar a MongoDB usando la misma configuración que el servidor
const connectDB = async () => {
  try {
    if (!config.mongodb.uri) {
      console.error('❌ MONGO_URI o MONGODB_URI no está definida en las variables de entorno');
      process.exit(1);
    }

    const mongoUri = config.mongodb.uri;
    console.log(`🔌 Conectando a MongoDB...`);
    console.log(`   URI: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`); // Ocultar credenciales
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    });
    
    console.log('✅ Conectado a MongoDB');
    console.log(`📊 Base de datos: ${mongoose.connection.name || 'default'}\n`);
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
};

// Función principal
async function setupUserSubscription() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
📋 Uso: node scripts/setupUserSubscription.js <email|username> <trial|premium> [opciones]

Ejemplos:
  # Configurar trial de 21 días
  node scripts/setupUserSubscription.js usuario@ejemplo.com trial 21

  # Configurar premium mensual
  node scripts/setupUserSubscription.js usuario@ejemplo.com premium monthly

  # Configurar premium anual
  node scripts/setupUserSubscription.js usuario@ejemplo.com premium yearly

  # Configurar trial por defecto (21 días)
  node scripts/setupUserSubscription.js usuario@ejemplo.com trial
    `);
    process.exit(1);
  }

  const [identifier, type, option] = args;
  const subscriptionType = type.toLowerCase();

  if (!['trial', 'premium'].includes(subscriptionType)) {
    console.error('❌ Tipo de suscripción inválido. Debe ser "trial" o "premium"');
    process.exit(1);
  }

  await connectDB();

  try {
    // Buscar usuario por email o username
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() }
      ]
    });

    if (!user) {
      console.error(`❌ Usuario no encontrado: ${identifier}`);
      process.exit(1);
    }

    console.log(`\n👤 Usuario encontrado:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   ID: ${user._id}`);
    console.log(`   Estado actual: ${user.subscription?.status || 'free'}\n`);

    const now = new Date();

    if (subscriptionType === 'trial') {
      // Configurar trial
      const days = option ? parseInt(option, 10) : 21;
      if (isNaN(days) || days < 1) {
        console.error('❌ Número de días inválido');
        process.exit(1);
      }

      const trialEndDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      // Actualizar modelo User
      user.subscription = {
        status: 'trial',
        trialStartDate: now,
        trialEndDate: trialEndDate,
        subscriptionStartDate: null,
        subscriptionEndDate: null,
        plan: null
      };
      await user.save();

      // Crear o actualizar modelo Subscription
      let subscription = await Subscription.findOne({ userId: user._id });
      if (!subscription) {
        subscription = new Subscription({
          userId: user._id,
          status: 'trialing',
          plan: 'monthly', // Plan por defecto para trial (Subscription acepta: weekly, monthly, quarterly, semestral, yearly)
          currentPeriodStart: now,
          currentPeriodEnd: trialEndDate,
          trialStart: now,
          trialEnd: trialEndDate
        });
      } else {
        subscription.status = 'trialing';
        subscription.plan = subscription.plan || 'monthly'; // Mantener plan existente o usar monthly
        subscription.currentPeriodStart = now;
        subscription.currentPeriodEnd = trialEndDate;
        subscription.trialStart = now;
        subscription.trialEnd = trialEndDate;
        subscription.cancelAtPeriodEnd = false;
        subscription.canceledAt = null;
        subscription.endedAt = null;
      }
      await subscription.save();

      console.log(`✅ Trial configurado exitosamente:`);
      console.log(`   Días: ${days}`);
      console.log(`   Inicio: ${now.toLocaleString('es-CL')}`);
      console.log(`   Fin: ${trialEndDate.toLocaleString('es-CL')}`);

    } else if (subscriptionType === 'premium') {
      // Configurar premium
      const plan = option || 'monthly';
      if (!['monthly', 'yearly'].includes(plan)) {
        console.error('❌ Plan inválido. Debe ser "monthly" o "yearly"');
        process.exit(1);
      }

      // Calcular fecha de fin según el plan
      const periodEnd = new Date(now);
      if (plan === 'monthly') {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      }

      // Actualizar modelo User
      user.subscription = {
        status: 'premium',
        trialStartDate: user.subscription?.trialStartDate || null,
        trialEndDate: user.subscription?.trialEndDate || null,
        subscriptionStartDate: now,
        subscriptionEndDate: periodEnd,
        plan: plan
      };
      await user.save();

      // Crear o actualizar modelo Subscription
      // Nota: Subscription acepta: weekly, monthly, quarterly, semestral, yearly
      // User solo acepta: monthly, yearly
      const subscriptionPlan = plan === 'monthly' ? 'monthly' : 'yearly';
      
      let subscription = await Subscription.findOne({ userId: user._id });
      if (!subscription) {
        subscription = new Subscription({
          userId: user._id,
          status: 'active',
          plan: subscriptionPlan,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          trialStart: null,
          trialEnd: null
        });
      } else {
        subscription.status = 'active';
        subscription.plan = subscriptionPlan;
        subscription.currentPeriodStart = now;
        subscription.currentPeriodEnd = periodEnd;
        subscription.cancelAtPeriodEnd = false;
        subscription.canceledAt = null;
        subscription.endedAt = null;
        subscription.trialStart = null;
        subscription.trialEnd = null;
      }
      await subscription.save();

      console.log(`✅ Premium configurado exitosamente:`);
      console.log(`   Plan: ${plan}`);
      console.log(`   Inicio: ${now.toLocaleString('es-CL')}`);
      console.log(`   Fin: ${periodEnd.toLocaleString('es-CL')}`);
    }

    console.log(`\n✅ Suscripción actualizada correctamente para ${user.email}\n`);

  } catch (error) {
    console.error('❌ Error configurando suscripción:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar script
setupUserSubscription();

