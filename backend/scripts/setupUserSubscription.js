/**
 * Script para configurar suscripción de usuario (Trial o Premium)
 * 
 * Uso:
 *   node scripts/setupUserSubscription.js <email|username> <trial|premium|extend-trial> [opción]
 *
 * Ejemplos:
 *   node scripts/setupUserSubscription.js usuario@ejemplo.com trial 21
 *   # Sumar 7 días al fin del trial actual (mantiene trialStart; si ya venció, parte desde hoy)
 *   node scripts/setupUserSubscription.js usuario@ejemplo.com extend-trial 7
 *   node scripts/setupUserSubscription.js usuario@ejemplo.com premium monthly
 *   node scripts/setupUserSubscription.js usuario@ejemplo.com premium yearly
 */

import mongoose from 'mongoose';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import config from '../config/config.js';
import { APP_TRIAL_DAYS, addTrialDays } from '../constants/subscription.js';

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
  # Configurar trial de N días (sin N: APP_TRIAL_DAYS, p. ej. 1)
  node scripts/setupUserSubscription.js usuario@ejemplo.com trial 7

  # Configurar premium mensual
  node scripts/setupUserSubscription.js usuario@ejemplo.com premium monthly

  # Configurar premium anual
  node scripts/setupUserSubscription.js usuario@ejemplo.com premium yearly

  # Configurar trial por defecto (APP_TRIAL_DAYS)
  node scripts/setupUserSubscription.js usuario@ejemplo.com trial

  # Aumentar trial: sumar N días al vencimiento actual (correo o username)
  node scripts/setupUserSubscription.js usuario@ejemplo.com extend-trial 10
    `);
    process.exit(1);
  }

  const [identifier, type, option] = args;
  const subscriptionType = type.toLowerCase();

  if (!['trial', 'premium', 'extend-trial'].includes(subscriptionType)) {
    console.error('❌ Tipo inválido. Usa "trial", "extend-trial" o "premium"');
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

    if (subscriptionType === 'extend-trial') {
      const addDays = option ? parseInt(option, 10) : NaN;
      if (isNaN(addDays) || addDays < 1) {
        console.error('❌ Indicá cuántos días sumar, p. ej.: extend-trial 7');
        process.exit(1);
      }

      if (user.subscription?.status === 'premium') {
        console.error('❌ El usuario tiene plan premium; no aplica extender trial.');
        process.exit(1);
      }

      const prevSub = user.subscription || {};
      const prevEnd = prevSub.trialEndDate ? new Date(prevSub.trialEndDate).getTime() : null;
      const baseMs = prevEnd != null ? Math.max(Date.now(), prevEnd) : Date.now();
      const trialEndDate = addTrialDays(new Date(baseMs), addDays);
      const trialStartDate = prevSub.trialStartDate ? new Date(prevSub.trialStartDate) : now;

      user.subscription = {
        status: 'trial',
        trialStartDate,
        trialEndDate,
        subscriptionStartDate: prevSub.subscriptionStartDate ?? null,
        subscriptionEndDate: prevSub.subscriptionEndDate ?? null,
        plan: null,
        trialGrantedAt: prevSub.trialGrantedAt || now,
        trialRetentionEmailSentAt: prevSub.trialRetentionEmailSentAt ?? null
      };
      await user.save();

      let subscription = await Subscription.findOne({ userId: user._id });
      if (!subscription) {
        subscription = new Subscription({
          userId: user._id,
          status: 'trialing',
          plan: 'monthly',
          currentPeriodStart: trialStartDate,
          currentPeriodEnd: trialEndDate,
          trialStart: trialStartDate,
          trialEnd: trialEndDate
        });
      } else {
        subscription.status = 'trialing';
        subscription.plan = subscription.plan || 'monthly';
        subscription.trialStart = subscription.trialStart || trialStartDate;
        subscription.trialEnd = trialEndDate;
        subscription.currentPeriodEnd = trialEndDate;
        subscription.cancelAtPeriodEnd = false;
        subscription.canceledAt = null;
        subscription.endedAt = null;
      }
      await subscription.save();

      console.log(`✅ Trial extendido (+${addDays} días):`);
      console.log(`   Nuevo fin: ${trialEndDate.toLocaleString('es-CL')}`);
      console.log(`   Inicio trial (sin cambiar si ya existía): ${trialStartDate.toLocaleString('es-CL')}`);
    } else if (subscriptionType === 'trial') {
      // Configurar trial
      const days = option ? parseInt(option, 10) : APP_TRIAL_DAYS;
      if (isNaN(days) || days < 1) {
        console.error('❌ Número de días inválido');
        process.exit(1);
      }

      const trialEndDate = addTrialDays(now, days);

      // Actualizar modelo User
      user.subscription = {
        status: 'trial',
        trialStartDate: now,
        trialEndDate,
        subscriptionStartDate: null,
        subscriptionEndDate: null,
        plan: null,
        trialGrantedAt: user.subscription?.trialGrantedAt || now,
      };
      await user.save();

      // Crear o actualizar modelo Subscription
      let subscription = await Subscription.findOne({ userId: user._id });
      if (!subscription) {
        subscription = new Subscription({
          userId: user._id,
          status: 'trialing',
          plan: 'monthly', // Plan por defecto para trial (Subscription acepta: monthly, quarterly, semestral, yearly)
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
      // Nota: Subscription acepta: monthly, quarterly, semestral, yearly
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

