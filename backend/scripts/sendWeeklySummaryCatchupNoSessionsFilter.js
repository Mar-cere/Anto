/**
 * Catch-up del resumen semanal SIN el filtro `stats.totalSessions >= 1`.
 *
 * Sigue respetando:
 * - email verificado + cuenta activa
 * - deduplicación por semana ISO UTC (`stats.lastWeeklyTipsEmailYearWeek` distinto de la actual o ausente)
 * - mismo claim atómico + envío + release si falla el mailer (lógica de `sendWeeklySummaryEmails`)
 *
 * No reenvía a quien ya tiene `lastWeeklyTipsEmailYearWeek` igual a la semana actual.
 *
 * Uso (desde `backend/`):
 *   node scripts/sendWeeklySummaryCatchupNoSessionsFilter.js --dry-run
 *   node scripts/sendWeeklySummaryCatchupNoSessionsFilter.js --confirm
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import User from '../models/User.js';
import emailMarketingService, {
  buildWeeklySummaryCandidateFilter
} from '../services/emailMarketingService.js';
import { getUtcIsoWeekParts } from '../utils/isoWeek.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const confirmed =
    process.argv.includes('--confirm') ||
    process.argv.includes('--yes') ||
    process.env.WEEKLY_SUMMARY_BROAD_CATCHUP_CONFIRM === 'true';

  if (!dryRun && !confirmed) {
    console.error(
      'Uso:\n' +
        '  node scripts/sendWeeklySummaryCatchupNoSessionsFilter.js --dry-run   (solo conteos)\n' +
        '  node scripts/sendWeeklySummaryCatchupNoSessionsFilter.js --confirm    (envía)\n' +
        '  o: WEEKLY_SUMMARY_BROAD_CATCHUP_CONFIRM=true node scripts/sendWeeklySummaryCatchupNoSessionsFilter.js'
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

    const { yearWeekKey } = getUtcIsoWeekParts();
    const conSesiones = await User.countDocuments(
      buildWeeklySummaryCandidateFilter(yearWeekKey, true)
    );
    const sinFiltroSesiones = await User.countDocuments(
      buildWeeklySummaryCandidateFilter(yearWeekKey, false)
    );
    const extraPorQuitarFiltro = Math.max(0, sinFiltroSesiones - conSesiones);

    console.log(`📅 Semana ISO (dedupe): ${yearWeekKey}`);
    console.log(`   Candidatos con filtro sesiones (job normal): ${conSesiones}`);
    console.log(`   Candidatos sin filtro sesiones (este script): ${sinFiltroSesiones}`);
    console.log(`   Diferencia (usuarios “recuperados”): ${extraPorQuitarFiltro}\n`);

    if (dryRun) {
      console.log('✅ --dry-run: no se envió ningún correo.');
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log('📧 Enviando lote con requireMinSessions=false ...\n');
    const results = await emailMarketingService.sendWeeklySummaryEmails({
      requireMinSessions: false
    });

    console.log('📊 Resultado:');
    console.log(`   📅 Semana ISO: ${results.yearWeekKey ?? '—'}`);
    console.log(`   requireMinSessions: ${results.requireMinSessions}`);
    console.log(`   ✅ Enviados: ${results.sent}`);
    console.log(`   ❌ Fallidos: ${results.failed}`);
    console.log(`   🔄 Procesados (claims en este run): ${results.processed}`);

    await mongoose.disconnect();
    console.log('\n✅ Listo');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    logger.error('sendWeeklySummaryCatchupNoSessionsFilter:', error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

main();
