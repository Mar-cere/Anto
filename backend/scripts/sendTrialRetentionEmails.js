/**
 * Envía correos de retención trial (prueba por finalizar) manualmente.
 *
 * Variables útiles (.env):
 *   TRIAL_RETENTION_EMAIL_AFTER_HOURS   (default 12)
 *   TRIAL_RETENTION_MAX_TRIAL_HOURS      (default 30, solo trials cortos)
 *   TRIAL_RETENTION_EMAIL_MAX_PER_RUN    (default 500)
 *
 * Uso:
 *   node scripts/sendTrialRetentionEmails.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import emailMarketingService from '../services/emailMarketingService.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function main() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI no está configurado en .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB\n');

    const results = await emailMarketingService.sendTrialRetentionEmails();

    console.log('\n📊 Resumen retención trial:');
    console.log(`   ✅ Enviados: ${results.sent}`);
    console.log(`   ❌ Fallidos: ${results.failed}`);
    console.log(`   ⏭️  Trial largo / soltados: ${results.skippedLongTrial}`);
    console.log(`   ⚠️  Inválidos / reclamo liberado: ${results.skippedInvalid ?? 0}`);
    console.log(`   📋 Procesados (claims): ${results.processed}`);

    await mongoose.disconnect();
    console.log('\n✅ Listo');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    logger.error('sendTrialRetentionEmails script:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

main();
