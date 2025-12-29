/**
 * Script para limpiar el caché de planes
 * 
 * Útil cuando se actualizan los precios y necesitas que se reflejen inmediatamente
 * 
 * Uso: node backend/scripts/clearPlansCache.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cacheService from '../services/cacheService.js';

dotenv.config();

async function clearPlansCache() {
  try {
    // Conectar a MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/anto';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    // Limpiar caché de planes
    const cacheKey = 'plans:all';
    await cacheService.delete(cacheKey);
    
    console.log('✅ Caché de planes limpiado exitosamente');
    console.log('Los nuevos precios se cargarán en la próxima solicitud');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error limpiando caché:', error);
    process.exit(1);
  }
}

clearPlansCache();

