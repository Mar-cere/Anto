/**
 * Script para enviar correos de re-engagement a usuarios inactivos
 * 
 * Uso:
 * node scripts/sendReEngagementEmails.js [días_inactivos]
 * 
 * Ejemplo:
 * node scripts/sendReEngagementEmails.js 7  (usuarios inactivos 7+ días)
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import emailMarketingService from '../services/emailMarketingService.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '../.env') });

const daysInactive = parseInt(process.argv[2]) || 7;

async function main() {
  try {
    // Conectar a MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ Error: MONGODB_URI no está configurado en .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    console.log(`\n📧 Enviando correos de re-engagement a usuarios inactivos ${daysInactive}+ días...\n`);

    const results = await emailMarketingService.sendReEngagementEmails(daysInactive);

    console.log('\n📊 Resumen:');
    console.log(`   ✅ Enviados: ${results.sent}`);
    console.log(`   ❌ Fallidos: ${results.failed}`);
    console.log(`   ⏭️  Omitidos: ${results.skipped}`);
    console.log(`   📋 Total revisados: ${results.checked}`);

    await mongoose.disconnect();
    console.log('\n✅ Proceso completado');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    logger.error('Error en sendReEngagementEmails script:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

main();

