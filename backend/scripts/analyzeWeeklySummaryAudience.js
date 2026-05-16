/**
 * Diagnóstico de audiencia para el correo de resumen semanal (sin envíos).
 *
 * Objetivo:
 * - estimar cuántos usuarios calzan con el filtro actual;
 * - estimar cuántos adicionales aparecen al relajar filtros;
 * - ayudar a decidir el siguiente catch-up de forma informada.
 *
 * Uso (desde `backend/`):
 *   node scripts/analyzeWeeklySummaryAudience.js
 *   node scripts/analyzeWeeklySummaryAudience.js --sample 20
 *
 * Nota: este script NO envía correos.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { buildWeeklySummaryCandidateFilter } from '../services/emailMarketingService.js';
import { getUtcIsoWeekParts } from '../utils/isoWeek.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

function parseSampleSize(argv) {
  const i = argv.findIndex((arg) => arg === '--sample');
  if (i < 0) return 0;
  const raw = argv[i + 1];
  const n = parseInt(raw || '', 10);
  if (!Number.isFinite(n) || n <= 0) return 10;
  return Math.min(n, 100);
}

async function main() {
  const sampleSize = parseSampleSize(process.argv);

  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI o MONGODB_URI debe estar en .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB\n');

    const { yearWeekKey } = getUtcIsoWeekParts();
    const notSentThisWeekFilter = {
      $or: [
        { 'stats.lastWeeklyTipsEmailYearWeek': { $exists: false } },
        { 'stats.lastWeeklyTipsEmailYearWeek': null },
        { 'stats.lastWeeklyTipsEmailYearWeek': { $ne: yearWeekKey } }
      ]
    };

    const strictFilter = buildWeeklySummaryCandidateFilter(yearWeekKey, true);
    const broadNoSessionsFilter = buildWeeklySummaryCandidateFilter(yearWeekKey, false);

    const totalUsers = await User.countDocuments({});
    const strictCandidates = await User.countDocuments(strictFilter);
    const broadNoSessionsCandidates = await User.countDocuments(broadNoSessionsFilter);
    const extraRemovingSessions = Math.max(0, broadNoSessionsCandidates - strictCandidates);

    const activeVerifiedNotSent = await User.countDocuments({
      emailVerified: true,
      isActive: true,
      ...notSentThisWeekFilter
    });
    const activeVerifiedAlreadySent = await User.countDocuments({
      emailVerified: true,
      isActive: true,
      'stats.lastWeeklyTipsEmailYearWeek': yearWeekKey
    });
    const activeVerifiedNoSessions = await User.countDocuments({
      emailVerified: true,
      isActive: true,
      ...notSentThisWeekFilter,
      $or: [
        { 'stats.totalSessions': { $exists: false } },
        { 'stats.totalSessions': null },
        { 'stats.totalSessions': { $lt: 1 } }
      ]
    });

    const activeUnverifiedNotSent = await User.countDocuments({
      emailVerified: false,
      isActive: true,
      ...notSentThisWeekFilter
    });
    const inactiveVerifiedNotSent = await User.countDocuments({
      emailVerified: true,
      isActive: false,
      ...notSentThisWeekFilter
    });
    const inactiveUnverifiedNotSent = await User.countDocuments({
      emailVerified: false,
      isActive: false,
      ...notSentThisWeekFilter
    });

    console.log(`📅 Semana ISO (dedupe): ${yearWeekKey}`);
    console.log(`👥 Total usuarios en BD: ${totalUsers}\n`);

    console.log('🎯 Elegibilidad (sin enviar):');
    console.log(`   Job normal (activo + verificado + >=1 sesión + no enviado semana): ${strictCandidates}`);
    console.log(`   Sin filtro de sesiones (activo + verificado + no enviado semana): ${broadNoSessionsCandidates}`);
    console.log(`   Extra al quitar sesiones: ${extraRemovingSessions}\n`);

    console.log('🧩 Desglose para encontrar más usuarios:');
    console.log(`   Activos+verificados ya enviados esta semana (dedupe): ${activeVerifiedAlreadySent}`);
    console.log(`   Activos+verificados pendientes (base broad): ${activeVerifiedNotSent}`);
    console.log(`   └─ De esos, con sesiones < 1 (potenciales por catch-up broad): ${activeVerifiedNoSessions}`);
    console.log(`   Activos no verificados (pendientes): ${activeUnverifiedNotSent}`);
    console.log(`   Inactivos verificados (pendientes): ${inactiveVerifiedNotSent}`);
    console.log(`   Inactivos no verificados (pendientes): ${inactiveUnverifiedNotSent}\n`);

    if (sampleSize > 0 && extraRemovingSessions > 0) {
      const sample = await User.find({
        emailVerified: true,
        isActive: true,
        ...notSentThisWeekFilter,
        $or: [
          { 'stats.totalSessions': { $exists: false } },
          { 'stats.totalSessions': null },
          { 'stats.totalSessions': { $lt: 1 } }
        ]
      })
        .select('email username name stats.totalSessions stats.lastActive createdAt')
        .sort({ 'stats.lastActive': -1, createdAt: -1, _id: 1 })
        .limit(sampleSize)
        .lean();

      console.log(`🧪 Muestra de usuarios “extra” por quitar filtro de sesiones (máx ${sampleSize}):`);
      for (const u of sample) {
        const label = u.name || u.username || '(sin nombre)';
        const sessions = Number.isFinite(Number(u?.stats?.totalSessions))
          ? Number(u.stats.totalSessions)
          : 0;
        const lastActive = u?.stats?.lastActive
          ? new Date(u.stats.lastActive).toISOString()
          : '—';
        console.log(`   - ${label} <${u.email}> | sessions=${sessions} | lastActive=${lastActive}`);
      }
      console.log('');
    }

    console.log('✅ Diagnóstico completado (dry-run, sin envíos).');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    logger.error('analyzeWeeklySummaryAudience:', error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

main();
