/**
 * Acorta trials activos cuya duración nominal supera APP_TRIAL_DAYS (p. ej. cuentas con 3 días).
 *
 * Política: trialEndDate := trialStartDate + APP_TRIAL_DAYS (no extiende trials ya más cortos).
 *
 * Uso:
 *   node backend/scripts/migrateActiveAppTrials.js              # dry-run
 *   node backend/scripts/migrateActiveAppTrials.js --apply      # aplicar
 *   node backend/scripts/migrateActiveAppTrials.js --apply --min-span-hours=48
 *
 * Env: MIGRATE_TRIAL_DRY_RUN=false equivale a --apply
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import config from '../config/config.js';
import cacheService from '../services/cacheService.js';
import { computeTrialSpanMs } from '../services/emailMarketingService.js';
import { APP_TRIAL_DAYS, APP_TRIAL_DURATION_MS } from '../constants/subscription.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

function parseArgs(argv) {
  const apply =
    argv.includes('--apply') || process.env.MIGRATE_TRIAL_DRY_RUN === 'false';
  const minSpanHoursRaw = argv.find((a) => a.startsWith('--min-span-hours='));
  const minSpanHours = minSpanHoursRaw
    ? parseInt(minSpanHoursRaw.split('=')[1], 10)
    : APP_TRIAL_DAYS * 24 + 1;
  return {
    apply,
    minSpanMs: Number.isFinite(minSpanHours) && minSpanHours > 0
      ? minSpanHours * 60 * 60 * 1000
      : APP_TRIAL_DURATION_MS + 1,
  };
}

/**
 * @param {Date|null|undefined} start
 * @param {Date|null|undefined} end
 * @param {Date} now
 */
export function computeCappedTrialEnd(start, end, now = new Date()) {
  if (!start || !end) {
    return null;
  }
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= now.getTime()) {
    return null;
  }
  const cappedMs = startMs + APP_TRIAL_DURATION_MS;
  if (cappedMs >= endMs) {
    return null;
  }
  return new Date(cappedMs);
}

async function main() {
  const { apply, minSpanMs } = parseArgs(process.argv.slice(2));
  const mode = apply ? 'APLICAR' : 'DRY-RUN';

  console.log(`\n🔄 Migración trials activos → máx. ${APP_TRIAL_DAYS} día(s) [${mode}]`);
  console.log(`   Umbral: span > ${Math.round(minSpanMs / 3600000)} h\n`);

  await mongoose.connect(config.database.uri);

  const now = new Date();
  const users = await User.find({
    'subscription.status': 'trial',
    'subscription.trialStartDate': { $exists: true, $ne: null },
    'subscription.trialEndDate': { $gt: now },
  }).select('email username subscription');

  let candidates = 0;
  let updated = 0;
  let expiredAfterCap = 0;

  for (const user of users) {
    const sub = user.subscription;
    const span = computeTrialSpanMs(sub.trialStartDate, sub.trialEndDate);
    if (span == null || span <= minSpanMs) {
      continue;
    }

    const newEnd = computeCappedTrialEnd(sub.trialStartDate, sub.trialEndDate, now);
    if (!newEnd) {
      continue;
    }

    candidates += 1;
    const alreadyExpired = newEnd.getTime() <= now.getTime();
    if (alreadyExpired) {
      expiredAfterCap += 1;
    }

    console.log(
      `  • ${user.email} | span ${Math.round(span / 3600000)}h → fin ${newEnd.toISOString()}`
    );

    if (!apply) {
      continue;
    }

    sub.trialEndDate = newEnd;
    if (newEnd.getTime() <= now.getTime()) {
      sub.status = 'expired';
    }
    await user.save();

    const subscription = await Subscription.findOne({ userId: user._id });
    if (subscription) {
      subscription.trialEnd = newEnd;
      subscription.currentPeriodEnd = newEnd;
      if (newEnd.getTime() <= now.getTime()) {
        subscription.status = 'expired';
      }
      await subscription.save();
    }

    await cacheService.invalidateUserCache(user._id.toString()).catch(() => {});
    updated += 1;
  }

  console.log(`\n📊 Candidatos: ${candidates}`);
  if (apply) {
    console.log(`   Actualizados: ${updated}`);
  } else {
    console.log('   (Ejecuta con --apply para persistir)');
  }
  if (expiredAfterCap > 0) {
    console.log(`   ⚠️  ${expiredAfterCap} quedarían vencidos al cap (fin ≤ ahora)`);
  }

  await mongoose.disconnect();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
