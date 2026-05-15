/**
 * Envía UN correo de prueba con la plantilla post-compra (con o sin bloque tipo comprobante).
 * No toca MongoDB.
 *
 * Uso:
 *   node scripts/sendSubscriptionThankYouTestEmail.js tu@email.com [nombreUsuario] [plan]
 *
 * Plan: monthly | quarterly | semestral | yearly (por defecto monthly).
 *
 * Con comprobante (segundo flag "receipt"):
 *   node scripts/sendSubscriptionThankYouTestEmail.js tu@email.com Ana monthly receipt
 *
 * O:
 *   SUBSCRIPTION_THANKYOU_TEST_EMAIL=tu@email.com node scripts/sendSubscriptionThankYouTestEmail.js
 *
 * Requiere en .env la misma configuración que el mailer.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mailer from '../config/mailer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function main() {
  const to = (process.argv[2] || process.env.SUBSCRIPTION_THANKYOU_TEST_EMAIL || '').trim();
  const username = (process.argv[3] || process.env.SUBSCRIPTION_THANKYOU_TEST_USERNAME || 'prueba').trim();
  const plan = (process.argv[4] || process.env.SUBSCRIPTION_THANKYOU_TEST_PLAN || 'monthly').trim();
  const withReceipt = (process.argv[5] || '').toLowerCase() === 'receipt';

  if (!to || !to.includes('@')) {
    console.error(
      'Uso: node scripts/sendSubscriptionThankYouTestEmail.js <email> [nombreUsuario] [plan] [receipt]\n' +
        '  o: SUBSCRIPTION_THANKYOU_TEST_EMAIL=email@dominio.com node scripts/sendSubscriptionThankYouTestEmail.js'
    );
    process.exit(1);
  }

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const receipt = withReceipt
    ? {
        purchaseDate: new Date(),
        amount: 9990,
        currency: 'CLP',
        providerLabel: 'Mercado Pago',
        reference: `TEST-MP-${Date.now()}`,
      }
    : null;

  console.log(`Enviando post-compra de prueba a: ${to}`);
  console.log(`Usuario: ${username}, plan: ${plan}, comprobante: ${withReceipt ? 'sí' : 'no'}`);

  try {
    const ok = await mailer.sendSubscriptionThankYouEmail(to, username, plan, periodEnd, receipt);
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
