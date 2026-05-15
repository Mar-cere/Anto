/**
 * Envía UN correo de prueba de renovación de suscripción (con comprobante).
 *
 * Uso:
 *   node scripts/sendSubscriptionRenewalTestEmail.js tu@email.com [nombreUsuario] [plan]
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mailer from '../config/mailer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function main() {
  const to = (process.argv[2] || process.env.SUBSCRIPTION_RENEWAL_TEST_EMAIL || '').trim();
  const username = (process.argv[3] || 'prueba').trim();
  const plan = (process.argv[4] || 'monthly').trim();

  if (!to || !to.includes('@')) {
    console.error(
      'Uso: node scripts/sendSubscriptionRenewalTestEmail.js <email> [nombreUsuario] [plan]'
    );
    process.exit(1);
  }

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const receipt = {
    purchaseDate: new Date(),
    amount: 9990,
    currency: 'CLP',
    providerLabel: 'Mercado Pago',
    reference: `TEST-RENEW-${Date.now()}`,
  };

  console.log(`Enviando renovación de prueba a: ${to}`);

  try {
    const ok = await mailer.sendSubscriptionRenewalEmail(to, username, plan, periodEnd, receipt);
    process.exit(ok ? 0 : 1);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

main();
