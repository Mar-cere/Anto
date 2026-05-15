/**
 * Envía UN correo de prueba con la plantilla de bienvenida (misma que tras el registro).
 * No toca MongoDB.
 *
 * Uso:
 *   node scripts/sendWelcomeTestEmail.js tu@email.com [nombreUsuario]
 *
 * O:
 *   WELCOME_TEST_EMAIL=tu@email.com node scripts/sendWelcomeTestEmail.js
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
  const to = (process.argv[2] || process.env.WELCOME_TEST_EMAIL || '').trim();
  const username = (process.argv[3] || process.env.WELCOME_TEST_USERNAME || 'prueba').trim();

  if (!to || !to.includes('@')) {
    console.error(
      'Uso: node scripts/sendWelcomeTestEmail.js <email> [nombreUsuario]\n' +
        '  o: WELCOME_TEST_EMAIL=email@dominio.com node scripts/sendWelcomeTestEmail.js'
    );
    process.exit(1);
  }

  console.log(`Enviando bienvenida de prueba a: ${to}`);
  console.log(`Nombre en plantilla: ${username}`);

  try {
    const ok = await mailer.sendWelcomeEmail(to, username);
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
