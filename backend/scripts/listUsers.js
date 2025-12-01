/**
 * Script para listar usuarios en la base de datos
 * 
 * Uso:
 *   node scripts/listUsers.js [email|username]
 * 
 * Ejemplos:
 *   node scripts/listUsers.js
 *   node scripts/listUsers.js marcelo
 */

import mongoose from 'mongoose';
import User from '../models/User.js';
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
async function listUsers() {
  const args = process.argv.slice(2);
  const searchTerm = args[0];

  await connectDB();

  try {
    let query = {};
    
    if (searchTerm) {
      query = {
        $or: [
          { email: { $regex: searchTerm, $options: 'i' } },
          { username: { $regex: searchTerm, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(query)
      .select('email username name subscription.status subscription.trialEndDate subscription.subscriptionEndDate createdAt')
      .sort({ createdAt: -1 })
      .limit(50);

    if (users.length === 0) {
      console.log('❌ No se encontraron usuarios');
      if (searchTerm) {
        console.log(`   Búsqueda: "${searchTerm}"\n`);
      }
      process.exit(0);
    }

    console.log(`📋 Usuarios encontrados: ${users.length}\n`);
    console.log('─'.repeat(100));
    console.log(
      'Email'.padEnd(35) +
      'Username'.padEnd(20) +
      'Estado'.padEnd(12) +
      'Trial hasta'.padEnd(20) +
      'Premium hasta'.padEnd(20)
    );
    console.log('─'.repeat(100));

    users.forEach(user => {
      const email = (user.email || '').padEnd(35);
      const username = (user.username || '').padEnd(20);
      const status = (user.subscription?.status || 'free').padEnd(12);
      
      let trialEnd = '-';
      if (user.subscription?.trialEndDate) {
        const trialDate = new Date(user.subscription.trialEndDate);
        const now = new Date();
        if (trialDate > now) {
          const daysLeft = Math.ceil((trialDate - now) / (1000 * 60 * 60 * 24));
          trialEnd = `${trialDate.toLocaleDateString('es-CL')} (${daysLeft}d)`;
        } else {
          trialEnd = `${trialDate.toLocaleDateString('es-CL')} (expirado)`;
        }
      }
      trialEnd = trialEnd.padEnd(20);
      
      let premiumEnd = '-';
      if (user.subscription?.subscriptionEndDate) {
        const premiumDate = new Date(user.subscription.subscriptionEndDate);
        const now = new Date();
        if (premiumDate > now) {
          const daysLeft = Math.ceil((premiumDate - now) / (1000 * 60 * 60 * 24));
          premiumEnd = `${premiumDate.toLocaleDateString('es-CL')} (${daysLeft}d)`;
        } else {
          premiumEnd = `${premiumDate.toLocaleDateString('es-CL')} (expirado)`;
        }
      }
      premiumEnd = premiumEnd.padEnd(20);

      console.log(`${email}${username}${status}${trialEnd}${premiumEnd}`);
    });

    console.log('─'.repeat(100));
    console.log(`\n💡 Para configurar suscripción, usa:`);
    console.log(`   node scripts/setupUserSubscription.js <email|username> <trial|premium> [opciones]\n`);

  } catch (error) {
    console.error('❌ Error listando usuarios:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar script
listUsers();

