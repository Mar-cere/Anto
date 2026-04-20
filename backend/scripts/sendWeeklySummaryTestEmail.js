/**
 * Envía UN correo de prueba con la plantilla de resumen semanal (misma que el job).
 * No toca MongoDB ni marca usuarios como enviados.
 *
 * Uso:
 *   node scripts/sendWeeklySummaryTestEmail.js tu@email.com [nombreUsuario]
 *
 * O:
 *   WEEKLY_SUMMARY_TEST_EMAIL=tu@email.com node scripts/sendWeeklySummaryTestEmail.js
 *
 * Requiere en .env lo mismo que el mailer (Gmail API, etc.) y, para el CTA app-only:
 *   WEEKLY_SUMMARY_EMAIL_OPEN_APP_ONLY=true
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mailer from '../config/mailer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function main() {
  const to = (process.argv[2] || process.env.WEEKLY_SUMMARY_TEST_EMAIL || '').trim();
  const username = (process.argv[3] || process.env.WEEKLY_SUMMARY_TEST_USERNAME || 'prueba').trim();

  if (!to || !to.includes('@')) {
    console.error(
      'Uso: node scripts/sendWeeklySummaryTestEmail.js <email> [username]\n' +
        '  o: WEEKLY_SUMMARY_TEST_EMAIL=email@dominio.com node scripts/sendWeeklySummaryTestEmail.js'
    );
    process.exit(1);
  }

  console.log(`Enviando resumen semanal de prueba a: ${to}`);
  console.log(`Usuario mostrado en plantilla: ${username}`);
  if (process.env.WEEKLY_SUMMARY_EMAIL_OPEN_APP_ONLY === 'true') {
    console.log('CTA: modo app-only (esquema custom / anto://)');
  }

  try {
    const ok = await mailer.sendWeeklySummaryEmail(to, username);
    if (ok) {
      console.log('✅ Correo enviado (revisa bandeja y spam).');
      process.exit(0);
    }
    console.error('❌ mailer devolvió false (revisa logs del mailer arriba).');
    process.exit(1);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

main();
