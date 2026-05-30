/**
 * Script para crear un usuario con suscripción (Trial o Premium)
 * 
 * Uso:
 *   node scripts/createUser.js <email> <username> <password> <trial|premium> [opciones]
 * 
 * Ejemplos:
 *   node scripts/createUser.js usuario@ejemplo.com usuario123 password123 trial 30
 *   node scripts/createUser.js usuario@ejemplo.com usuario123 password123 premium monthly
 */

import mongoose from 'mongoose';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import config from '../config/config.js';
import crypto from 'crypto';
import { APP_TRIAL_DAYS, addTrialDays } from '../constants/subscription.js';

// Función para hashear contraseña (copiada de authRoutes)
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

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
async function createUser() {
  const args = process.argv.slice(2);

  if (args.length < 4) {
    console.log(`
📋 Uso: node scripts/createUser.js <email> <username> <password> <trial|premium> [opciones]

Ejemplos:
  # Crear usuario con trial de 30 días
  node scripts/createUser.js usuario@ejemplo.com usuario123 password123 trial 30

  # Crear usuario con premium mensual
  node scripts/createUser.js usuario@ejemplo.com usuario123 password123 premium monthly

  # Crear usuario con premium anual
  node scripts/createUser.js usuario@ejemplo.com usuario123 password123 premium yearly

  # Crear usuario con trial por defecto (APP_TRIAL_DAYS, p. ej. 1)
  node scripts/createUser.js usuario@ejemplo.com usuario123 password123 trial
    `);
    process.exit(1);
  }

  const [email, username, password, type, option] = args;
  const subscriptionType = type.toLowerCase();

  if (!['trial', 'premium'].includes(subscriptionType)) {
    console.error('❌ Tipo de suscripción inválido. Debe ser "trial" o "premium"');
    process.exit(1);
  }

  await connectDB();

  try {
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });

    if (existingUser) {
      console.error(`❌ El usuario ya existe:`);
      console.error(`   Email: ${existingUser.email}`);
      console.error(`   Username: ${existingUser.username}`);
      console.error(`\n💡 Usa el script setupUserSubscription.js para actualizar la suscripción:`);
      console.error(`   node scripts/setupUserSubscription.js ${email} ${subscriptionType} ${option || ''}\n`);
      process.exit(1);
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Email inválido');
      process.exit(1);
    }

    // Validar username (máximo 20 caracteres)
    if (username.length > 20) {
      console.error('❌ El username debe tener máximo 20 caracteres');
      process.exit(1);
    }

    // Validar password (mínimo 6 caracteres)
    if (password.length < 6) {
      console.error('❌ La contraseña debe tener al menos 6 caracteres');
      process.exit(1);
    }

    // Generar hash de contraseña
    const { salt, hash } = hashPassword(password);

    const now = new Date();
    let userData = {
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password: hash,
      salt,
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'es'
      },
      stats: {
        tasksCompleted: 0,
        habitsStreak: 0,
        totalSessions: 0,
        lastActive: now
      }
    };

    // Configurar suscripción
    if (subscriptionType === 'trial') {
      const days = option ? parseInt(option, 10) : APP_TRIAL_DAYS;
      if (isNaN(days) || days < 1) {
        console.error('❌ Número de días inválido');
        process.exit(1);
      }

      const trialEndDate = addTrialDays(now, days);

      userData.subscription = {
        status: 'trial',
        trialStartDate: now,
        trialEndDate,
        subscriptionStartDate: null,
        subscriptionEndDate: null,
        plan: null,
        trialGrantedAt: now,
      };

      // Crear usuario
      const user = new User(userData);
      await user.save();

      // Crear suscripción
      const subscription = new Subscription({
        userId: user._id,
        status: 'trialing',
        plan: 'monthly',
        currentPeriodStart: now,
        currentPeriodEnd: trialEndDate,
        trialStart: now,
        trialEnd: trialEndDate
      });
      await subscription.save();

      console.log(`✅ Usuario creado exitosamente con trial:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Trial: ${days} días`);
      console.log(`   Fin del trial: ${trialEndDate.toLocaleString('es-CL')}\n`);

    } else if (subscriptionType === 'premium') {
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

      userData.subscription = {
        status: 'premium',
        trialStartDate: null,
        trialEndDate: null,
        subscriptionStartDate: now,
        subscriptionEndDate: periodEnd,
        plan: plan
      };

      // Crear usuario
      const user = new User(userData);
      await user.save();

      // Crear suscripción
      const subscription = new Subscription({
        userId: user._id,
        status: 'active',
        plan: plan === 'monthly' ? 'monthly' : 'yearly',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        trialStart: null,
        trialEnd: null
      });
      await subscription.save();

      console.log(`✅ Usuario creado exitosamente con premium:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Plan: ${plan}`);
      console.log(`   Fin de suscripción: ${periodEnd.toLocaleString('es-CL')}\n`);
    }

  } catch (error) {
    console.error('❌ Error creando usuario:', error.message);
    if (error.code === 11000) {
      console.error('   El email o username ya está en uso');
    }
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar script
createUser();

