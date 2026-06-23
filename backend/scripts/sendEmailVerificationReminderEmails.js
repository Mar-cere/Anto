/**
 * Job manual: recordatorio de registro (email sin verificar).
 *
 * Uso (desde `backend/`):
 *   node scripts/sendEmailVerificationReminderEmails.js --dry-run
 *   node scripts/sendEmailVerificationReminderEmails.js --confirm
 *
 * Variables (.env):
 *   EMAIL_VERIFICATION_REMINDER_AFTER_HOURS (default 24)
 *   EMAIL_VERIFICATION_REMINDER_MAX_PER_RUN (default 300)
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import User from '../models/User.js';
import emailMarketingService, {
  buildEmailVerificationReminderBaseFilter,
} from '../services/emailMarketingService.js';
import { getEmailVerificationReminderAfterHours } from '../constants/email.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const confirmed =
    process.argv.includes('--confirm') ||
    process.argv.includes('--yes') ||
    process.env.EMAIL_VERIFICATION_REMINDER_CONFIRM === 'true';

  if (!dryRun && !confirmed) {
    console.error(
      'Uso:\n' +
        '  node scripts/sendEmailVerificationReminderEmails.js --dry-run\n' +
        '  node scripts/sendEmailVerificationReminderEmails.js --confirm\n' +
        '  o: EMAIL_VERIFICATION_REMINDER_CONFIRM=true node scripts/sendEmailVerificationReminderEmails.js',
    );
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('Falta MONGODB_URI en el entorno.');
    process.exit(1);
  }

  const afterHours = getEmailVerificationReminderAfterHours();
  const now = new Date();
  const filter = buildEmailVerificationReminderBaseFilter(now, afterHours);

  await mongoose.connect(mongoUri);
  try {
    const candidates = await User.countDocuments(filter);
    const sample = await User.find(filter)
      .sort({ createdAt: 1 })
      .limit(5)
      .select('email username createdAt emailVerified')
      .lean();

    console.log(`📧 Recordatorio registro sin verificar`);
    console.log(`   Ventana: registrados hace ≥ ${afterHours} h`);
    console.log(`   Candidatos elegibles (sin recordatorio previo): ${candidates}\n`);

    if (sample.length > 0) {
      console.log('   Muestra (hasta 5, más antiguos primero):');
      for (const u of sample) {
        console.log(
          `   - ${u.email} | ${u.username || '—'} | registro ${new Date(u.createdAt).toISOString()}`,
        );
      }
      console.log('');
    }

    if (dryRun) {
      console.log('✅ --dry-run: no se envió ningún correo.');
      process.exit(0);
    }

    console.log('📤 Enviando...\n');
    const results = await emailMarketingService.sendEmailVerificationReminderEmails();
    logger.info('[sendEmailVerificationReminderEmails]', results);
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  } catch (error) {
    logger.error('sendEmailVerificationReminderEmails script:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
