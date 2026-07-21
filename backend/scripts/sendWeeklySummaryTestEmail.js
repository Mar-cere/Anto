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
 * CTA recomendado (HTTPS, iOS + Android desde Gmail):
 *   EMAIL_APP_OPEN_LINK=https://www.antoapps.com/open?to=weekly-summary
 *
 * Fallback legacy (frágil en clientes de correo):
 *   WEEKLY_SUMMARY_EMAIL_OPEN_APP_ONLY=true
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mailer, { buildEmailAppOpenHref } from '../config/mailer.js';

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

  const ctaHref = buildEmailAppOpenHref(process.env);
  console.log(`Enviando resumen semanal de prueba a: ${to}`);
  console.log(`Usuario mostrado en plantilla: ${username}`);
  console.log(`CTA href efectivo: ${ctaHref}`);
  if (/^https?:\/\//i.test(ctaHref)) {
    console.log('CTA: HTTPS (recomendado para Gmail / Android / iOS).');
  } else if (/^anto:/i.test(ctaHref)) {
    console.warn(
      '⚠️  CTA: esquema anto:// — muchos clientes de correo no lo abren. ' +
        'Usa EMAIL_APP_OPEN_LINK=https://www.antoapps.com/open?to=weekly-summary'
    );
  }
  if (process.env.WEEKLY_SUMMARY_EMAIL_OPEN_APP_ONLY === 'true' && !process.env.EMAIL_APP_OPEN_LINK) {
    console.log('(WEEKLY_SUMMARY_EMAIL_OPEN_APP_ONLY=true sin EMAIL_APP_OPEN_LINK)');
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
