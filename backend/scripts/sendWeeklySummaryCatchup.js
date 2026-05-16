/**
 * Catch-up manual del correo de aviso de resumen semanal (misma lógica que el job programado).
 *
 * Ejecuta `emailMarketingService.sendWeeklySummaryEmails()`:
 * - reclama usuarios elegibles y marca `stats.lastWeeklyTipsEmailYearWeek` para la semana ISO UTC actual;
 * - envía el correo; si falla el envío, libera el claim (como el job).
 *
 * Uso (desde la carpeta `backend`, con .env con MONGODB_URI):
 *   node scripts/sendWeeklySummaryCatchup.js --confirm
 *
 * Seguridad: sin `--confirm` no hace nada (evita disparos accidentales en cron/CI).
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
  const confirmed =
    process.argv.includes('--confirm') ||
    process.argv.includes('--yes') ||
    process.env.WEEKLY_SUMMARY_CATCHUP_CONFIRM === 'true';

  if (!confirmed) {
    console.error(
      'Catch-up del resumen semanal: requiere confirmación explícita.\n' +
        '  node scripts/sendWeeklySummaryCatchup.js --confirm\n' +
        '  o: WEEKLY_SUMMARY_CATCHUP_CONFIRM=true node scripts/sendWeeklySummaryCatchup.js'
    );
    process.exit(1);
  }

  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI o MONGODB_URI debe estar en .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB\n');
    console.log('📧 Ejecutando lote manual de resumen semanal (catch-up)...\n');

    const results = await emailMarketingService.sendWeeklySummaryEmails();

    console.log('📊 Resultado:');
    console.log(`   📅 Semana ISO (dedupe): ${results.yearWeekKey ?? '—'}`);
    console.log(`   ✅ Enviados: ${results.sent}`);
    console.log(`   ❌ Fallidos: ${results.failed}`);
    console.log(`   🔄 Procesados (claims en este run): ${results.processed}`);
    console.log(`   🎁 Regalo trial configurado: +${results.trialGiftDays ?? 2} día(s)`);
    console.log(`   🎁 Regalo trial aplicado: ${results.trialGiftApplied ?? 0}`);
    console.log(`   🎁 Regalo trial omitido (no elegibles): ${results.trialGiftSkipped ?? 0}`);
    console.log(`   ⚠️ Regalo trial con error: ${results.trialGiftErrors ?? 0}`);

    await mongoose.disconnect();
    console.log('\n✅ Listo');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    logger.error('sendWeeklySummaryCatchup:', error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

main();
