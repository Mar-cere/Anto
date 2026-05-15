/**
 * Envía UN correo de prueba con la plantilla de re-engagement (misma que marketing inactivos).
 * No toca MongoDB.
 *
 * Uso:
 *   node scripts/sendReEngagementTestEmail.js tu@email.com [nombreUsuario] [díasInactivo]
 *
 * O:
 *   RE_ENGAGEMENT_TEST_EMAIL=tu@email.com node scripts/sendReEngagementTestEmail.js
 *
 * Requiere en .env la misma configuración que el mailer (Gmail API, SendGrid o SMTP).
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mailer from '../config/mailer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function main() {
  const to = (process.argv[2] || process.env.RE_ENGAGEMENT_TEST_EMAIL || '').trim();
  const username = (process.argv[3] || process.env.RE_ENGAGEMENT_TEST_USERNAME || 'prueba').trim();
  const daysArg = process.argv[4] ?? process.env.RE_ENGAGEMENT_TEST_DAYS;
  const daysInactive = daysArg !== undefined && daysArg !== '' ? parseInt(String(daysArg), 10) : 7;

  if (!to || !to.includes('@')) {
    console.error(
      'Uso: node scripts/sendReEngagementTestEmail.js <email> [nombreUsuario] [díasInactivo]\n' +
        '  o: RE_ENGAGEMENT_TEST_EMAIL=email@dominio.com node scripts/sendReEngagementTestEmail.js'
    );
    process.exit(1);
  }

  if (!Number.isFinite(daysInactive) || daysInactive < 1) {
    console.error('díasInactivo debe ser un entero ≥ 1');
    process.exit(1);
  }

  console.log(`Enviando re-engagement de prueba a: ${to}`);
  console.log(`Nombre en plantilla: ${username}, días inactivo: ${daysInactive}`);

  try {
    const ok = await mailer.sendReEngagementEmail(to, username, daysInactive);
    if (ok) {
      console.log('✅ Correo enviado (revisa bandeja y spam).');
      process.exit(0);
    }
    console.error('❌ mailer devolvió false (revisa logs del mailer).');
    process.exit(1);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

main();
