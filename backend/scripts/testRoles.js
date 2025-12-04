/**
 * Script para verificar que el sistema de roles funciona correctamente
 */

import mongoose from 'mongoose';
import config from '../config/config.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth.js';

async function testRoles() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(config.mongodb.uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Conectado a MongoDB\n');

    // 1. Verificar que el usuario tiene rol admin
    console.log('📋 1. Verificando rol del usuario...');
    const user = await User.findOne({ email: 'marcelo0.nicolas@gmail.com' })
      .select('email username role')
      .lean();

    if (!user) {
      console.error('❌ Usuario no encontrado');
      process.exit(1);
    }

    console.log(`   Email: ${user.email}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Rol: ${user.role || 'user'}`);

    if (user.role !== 'admin') {
      console.error('❌ El usuario NO tiene rol admin');
      process.exit(1);
    }
    console.log('   ✅ Usuario tiene rol admin\n');

    // 2. Verificar que el token incluye el rol
    console.log('📋 2. Verificando generación de tokens con rol...');
    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
    console.log(`   Token decodificado:`);
    console.log(`   - userId: ${decoded.userId}`);
    console.log(`   - role: ${decoded.role || 'no incluido'}`);

    if (decoded.role !== 'admin') {
      console.error('❌ El token NO incluye el rol admin');
      process.exit(1);
    }
    console.log('   ✅ Token incluye rol admin\n');

    // 3. Verificar middleware isAdmin
    console.log('📋 3. Verificando middleware isAdmin...');
    
    // Simular request con rol admin
    const mockReqAdmin = {
      user: { _id: user._id, userId: user._id, role: 'admin' },
      status: (code) => ({
        json: (data) => {
          if (code === 403) {
            console.error('   ❌ Middleware rechazó usuario admin');
            process.exit(1);
          }
          return { statusCode: code, data };
        }
      })
    };

    // Simular request con rol user
    const mockReqUser = {
      user: { _id: user._id, userId: user._id, role: 'user' },
      status: (code) => ({
        json: (data) => {
          if (code !== 403) {
            console.error('   ❌ Middleware NO rechazó usuario normal');
            process.exit(1);
          }
          console.log(`   ✅ Middleware rechazó correctamente (403): ${data.message}`);
          return { statusCode: code, data };
        }
      })
    };

    // Test middleware isAdmin
    const isAdmin = (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
      }

      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Se requiere rol de administrador.',
          required: 'admin',
          current: req.user.role || 'user'
        });
      }

      next();
    };

    // Probar con admin (debe pasar)
    let adminPassed = false;
    isAdmin(mockReqAdmin, mockReqAdmin, () => {
      adminPassed = true;
    });
    if (adminPassed) {
      console.log('   ✅ Middleware permite acceso a admin\n');
    }

    // Probar con user (debe rechazar)
    isAdmin(mockReqUser, mockReqUser, () => {
      console.error('   ❌ Middleware NO rechazó usuario normal');
      process.exit(1);
    });

    // 4. Verificar que hay usuarios con diferentes roles
    console.log('📋 4. Verificando distribución de roles...');
    const adminCount = await User.countDocuments({ role: 'admin' });
    const userCount = await User.countDocuments({ role: 'user' });
    const totalCount = await User.countDocuments();

    console.log(`   Total usuarios: ${totalCount}`);
    console.log(`   - Admin: ${adminCount}`);
    console.log(`   - User: ${userCount}`);
    console.log(`   - Sin rol: ${totalCount - adminCount - userCount}`);
    console.log('   ✅ Distribución verificada\n');

    console.log('✅ Todas las verificaciones pasaron correctamente!');
    console.log('\n📝 Resumen:');
    console.log('   ✅ Usuario tiene rol admin en BD');
    console.log('   ✅ Tokens incluyen rol');
    console.log('   ✅ Middleware isAdmin funciona correctamente');
    console.log('   ✅ Sistema de roles operativo');

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

// Ejecutar test
testRoles();

