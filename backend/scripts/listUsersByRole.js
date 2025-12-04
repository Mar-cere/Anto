/**
 * Script para listar usuarios por rol
 * 
 * Uso:
 *   node scripts/listUsersByRole.js [role]
 * 
 * Si no se especifica rol, lista todos los usuarios agrupados por rol
 * 
 * Ejemplos:
 *   node scripts/listUsersByRole.js
 *   node scripts/listUsersByRole.js admin
 *   node scripts/listUsersByRole.js user
 */

import mongoose from 'mongoose';
import config from '../config/config.js';
import User from '../models/User.js';

async function listUsersByRole() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(config.mongodb.uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Conectado a MongoDB\n');

    // Obtener argumentos de línea de comandos
    const args = process.argv.slice(2);
    const filterRole = args[0]?.toLowerCase();

    if (filterRole) {
      // Listar usuarios de un rol específico
      const users = await User.find({ role: filterRole })
        .select('email username role createdAt isActive')
        .sort({ createdAt: -1 })
        .lean();

      if (users.length === 0) {
        console.log(`❌ No se encontraron usuarios con rol: ${filterRole}`);
        process.exit(0);
      }

      console.log(`📋 Usuarios con rol "${filterRole}" (${users.length}):\n`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.username})`);
        console.log(`   Rol: ${user.role || 'user'}`);
        console.log(`   Activo: ${user.isActive ? 'Sí' : 'No'}`);
        console.log(`   Creado: ${new Date(user.createdAt).toLocaleDateString()}`);
        console.log('');
      });
    } else {
      // Listar todos los usuarios agrupados por rol
      const users = await User.find()
        .select('email username role createdAt isActive')
        .sort({ role: 1, createdAt: -1 })
        .lean();

      // Agrupar por rol
      const byRole = {
        admin: [],
        moderator: [],
        user: [],
        null: [] // usuarios sin rol asignado
      };

      users.forEach(user => {
        const role = user.role || 'null';
        if (byRole[role]) {
          byRole[role].push(user);
        } else {
          byRole.null.push(user);
        }
      });

      // Mostrar estadísticas
      console.log('📊 Estadísticas de usuarios por rol:\n');
      Object.entries(byRole).forEach(([role, roleUsers]) => {
        if (roleUsers.length > 0) {
          const displayRole = role === 'null' ? 'sin rol' : role;
          console.log(`   ${displayRole}: ${roleUsers.length} usuario(s)`);
        }
      });
      console.log(`   Total: ${users.length} usuario(s)\n`);

      // Mostrar detalles por rol
      Object.entries(byRole).forEach(([role, roleUsers]) => {
        if (roleUsers.length > 0) {
          const displayRole = role === 'null' ? 'Sin rol asignado' : `Rol: ${role}`;
          console.log(`\n📋 ${displayRole} (${roleUsers.length}):`);
          roleUsers.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.email} (${user.username})`);
            console.log(`      Activo: ${user.isActive ? 'Sí' : 'No'}`);
            console.log(`      Creado: ${new Date(user.createdAt).toLocaleDateString()}`);
          });
        }
      });
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
listUsersByRole();

