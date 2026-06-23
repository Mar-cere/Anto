/**
 * Envía UN correo de prueba con la plantilla de recordatorio de registro (sin código).
 *
 * Uso:
 *   node scripts/sendEmailVerificationReminderTestEmail.js tu@email.com [username]
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mailer from '../config/mailer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function main() {
  const to = (process.argv[2] || process.env.EMAIL_VERIFICATION_REMINDER_TEST_EMAIL || '').trim();
  const username = (process.argv[3] || process.env.EMAIL_VERIFICATION_REMINDER_TEST_USERNAME || 'usuario').trim();

  if (!to || !to.includes('@')) {
    console.error(
      'Uso: node scripts/sendEmailVerificationReminderTestEmail.js <email> [username]',
    );
    process.exit(1);
  }

  console.log(`Enviando recordatorio de registro de prueba a: ${to}`);

  try {
    const ok = await mailer.sendEmailVerificationReminderEmail(to, username);
    if (ok) {
      console.log('✅ Correo enviado (revisa bandeja y spam).');
      process.exit(0);
    }
    console.error('❌ mailer devolvió false.');
    process.exit(1);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
