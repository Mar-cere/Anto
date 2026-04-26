/**
 * Envía UN correo de prueba con la plantilla de retención trial
 * (misma que usa el flujo real), sin tocar MongoDB.
 *
 * Uso:
 *   node scripts/sendTrialRetentionTestEmail.js tu@email.com [username] [hoursLeft]
 *
 * Ejemplos:
 *   node scripts/sendTrialRetentionTestEmail.js test@dominio.com Marcelo 6
 *   TRIAL_RETENTION_TEST_EMAIL=test@dominio.com node scripts/sendTrialRetentionTestEmail.js
 *
 * Variables opcionales (.env):
 *   TRIAL_RETENTION_TEST_EMAIL
 *   TRIAL_RETENTION_TEST_USERNAME
 *   TRIAL_RETENTION_TEST_HOURS_LEFT (default 24)
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mailer from '../config/mailer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

function parseHours(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 24;
  return Math.min(Math.round(n), 24 * 30);
}

async function main() {
  const to = (process.argv[2] || process.env.TRIAL_RETENTION_TEST_EMAIL || '').trim();
  const username = (process.argv[3] || process.env.TRIAL_RETENTION_TEST_USERNAME || 'usuario').trim();
  const hoursLeft = parseHours(process.argv[4] || process.env.TRIAL_RETENTION_TEST_HOURS_LEFT || '24');
  const trialEndDate = new Date(Date.now() + hoursLeft * 60 * 60 * 1000);

  if (!to || !to.includes('@')) {
    console.error(
      'Uso: node scripts/sendTrialRetentionTestEmail.js <email> [username] [hoursLeft]\n' +
        '  o: TRIAL_RETENTION_TEST_EMAIL=email@dominio.com node scripts/sendTrialRetentionTestEmail.js'
    );
    process.exit(1);
  }

  console.log(`Enviando correo trial retention de prueba a: ${to}`);
  console.log(`Usuario mostrado: ${username}`);
  console.log(`Horas restantes simuladas: ${hoursLeft}`);
  console.log(`Fecha fin trial simulada: ${trialEndDate.toISOString()}`);

  try {
    const ok = await mailer.sendTrialRetentionEmail(to, username, trialEndDate);
    if (ok) {
      console.log('✅ Correo enviado (revisa bandeja y spam).');
      process.exit(0);
    }
    console.error('❌ mailer devolvió false (revisa logs del mailer arriba).');
    process.exit(1);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
