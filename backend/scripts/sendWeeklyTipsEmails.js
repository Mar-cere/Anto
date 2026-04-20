/**
 * Script para enviar el correo de aviso de resumen semanal (plantilla neutra).
 *
 * Uso:
 *   node scripts/sendWeeklyTipsEmails.js
 *
 * (El nombre del archivo se mantiene por compatibilidad con cron existente.)
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

async function main() {
  try {
    // Conectar a MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ Error: MONGO_URI o MONGODB_URI debe estar en .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    console.log('\n📧 Enviando correos de aviso de resumen semanal...\n');

    const results = await emailMarketingService.sendWeeklySummaryEmails();

    console.log('\n📊 Resumen:');
    console.log(`   📅 Semana ISO (dedupe): ${results.yearWeekKey ?? '—'}`);
    console.log(`   ✅ Enviados: ${results.sent}`);
    console.log(`   ❌ Fallidos: ${results.failed}`);
    console.log(`   🔄 Usuarios reclamados/enviados en este run: ${results.processed}`);

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

