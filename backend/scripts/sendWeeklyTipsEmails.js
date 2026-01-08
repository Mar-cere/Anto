/**
 * Script para enviar correos de tips semanales
 * 
 * Uso:
 * node scripts/sendWeeklyTipsEmails.js [número_semana]
 * 
 * Ejemplo:
 * node scripts/sendWeeklyTipsEmails.js 5  (semana 5)
 * 
 * Si no se especifica número de semana, se calcula automáticamente
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

const weekNumber = process.argv[2] ? parseInt(process.argv[2]) : null;

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

    const week = weekNumber || 'automático';
    console.log(`\n📧 Enviando correos de tips semanales (semana ${week})...\n`);

    const results = await emailMarketingService.sendWeeklyTipsEmails(weekNumber);

    console.log('\n📊 Resumen:');
    console.log(`   ✅ Enviados: ${results.sent}`);
    console.log(`   ❌ Fallidos: ${results.failed}`);
    console.log(`   📋 Total revisados: ${results.checked}`);

    await mongoose.disconnect();
    console.log('\n✅ Proceso completado');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    logger.error('Error en sendWeeklyTipsEmails script:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

main();

