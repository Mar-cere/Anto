/**
 * Script para verificar la conexión a la base de datos y contar usuarios
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
    console.log('🔌 Conectando a MongoDB...');
    console.log(`   URI: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`); // Ocultar credenciales
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    });
    
    console.log('✅ Conectado a MongoDB\n');
    
    // Mostrar información de la base de datos
    const db = mongoose.connection.db;
    const dbName = db.databaseName;
    console.log(`📊 Base de datos: ${dbName}`);
    
    // Contar usuarios
    const userCount = await User.countDocuments();
    console.log(`👥 Total de usuarios: ${userCount}\n`);
    
    if (userCount > 0) {
      // Mostrar algunos usuarios de ejemplo
      const sampleUsers = await User.find()
        .select('email username subscription.status')
        .limit(5);
      
      console.log('📋 Ejemplos de usuarios:');
      sampleUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.username}) - ${user.subscription?.status || 'free'}`);
      });
    } else {
      console.log('⚠️  No hay usuarios en la base de datos');
      console.log('💡 Puedes crear un usuario registrándote en la app o usando el endpoint POST /api/auth/register\n');
    }
    
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Desconectado de MongoDB');
  }
};

connectDB();

