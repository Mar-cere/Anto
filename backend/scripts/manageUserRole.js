/**
 * Script para gestionar roles de usuarios
 * 
 * Uso:
 *   node scripts/manageUserRole.js <email|username> <role>
 * 
 * Roles disponibles: user, admin, moderator, emergency
 * 
 * Ejemplos:
 *   node scripts/manageUserRole.js admin@example.com admin
 *   node scripts/manageUserRole.js usuario123 user
 */

import mongoose from 'mongoose';
import config from '../config/config.js';
import User from '../models/User.js';

const VALID_ROLES = ['user', 'admin', 'moderator', 'emergency'];

async function manageUserRole() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(config.mongodb.uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Conectado a MongoDB');

    // Obtener argumentos de línea de comandos
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.error('❌ Uso: node scripts/manageUserRole.js <email|username> <role>');
      console.error('   Roles disponibles:', VALID_ROLES.join(', '));
      process.exit(1);
    }

    const identifier = args[0]; // email o username
    const newRole = args[1].toLowerCase(); // rol a asignar

    // Validar rol
    if (!VALID_ROLES.includes(newRole)) {
      console.error(`❌ Rol inválido: ${newRole}`);
      console.error('   Roles disponibles:', VALID_ROLES.join(', '));
      process.exit(1);
    }

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

    // Mostrar información actual
    console.log('\n📋 Información del usuario:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Rol actual: ${user.role || 'user'}`);
    console.log(`   Rol nuevo: ${newRole}`);

    // Confirmar cambio
    if (user.role === newRole) {
      console.log('\n✅ El usuario ya tiene este rol asignado.');
      process.exit(0);
    }

    // Actualizar rol
    user.role = newRole;
    await user.save();

    console.log(`\n✅ Rol actualizado exitosamente a: ${newRole}`);
    console.log(`   El usuario ${user.email} ahora tiene rol: ${newRole}`);

    // Advertencia si es admin
    if (newRole === 'admin') {
      console.log('\n⚠️  ADVERTENCIA: Este usuario ahora tiene acceso completo a:');
      console.log('   - Métricas del sistema');
      console.log('   - Estadísticas de salud');
      console.log('   - Métricas de pagos');
      console.log('   - Recuperación de pagos');
    }

    // Advertencia si es emergency
    if (newRole === 'emergency') {
      console.log('\n⚠️  ADVERTENCIA: Este usuario ahora tiene:');
      console.log('   - Acceso al chat sin suscripción activa');
      console.log('   - Bypass de restricciones de suscripción');
      console.log('   - Acceso prioritario al sistema de emergencia');
      console.log('   - Este rol debe usarse solo en casos de crisis');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Conexión cerrada');
  }
}

// Ejecutar script
manageUserRole();

