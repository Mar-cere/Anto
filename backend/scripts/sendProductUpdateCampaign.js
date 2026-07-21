/**
 * Campaña puntual: novedades de producto + regalo de 1 día de prueba Premium (si califica).
 *
 * Usa la misma plantilla que el resumen semanal (`sendWeeklySummaryEmail`) con dedupe por
 * `stats.lastProductUpdateCampaignKey` (no por semana ISO), para poder reenviar a quien ya
 * recibió el correo semanal con copy antiguo.
 *
 * Variables recomendadas en el entorno del run:
 *   WEEKLY_SUMMARY_TRIAL_GIFT_DAYS=1
 *   PRODUCT_UPDATE_CAMPAIGN_ID=1.5.6   (default si no se pasa --campaign)
 *
 * Uso (desde `backend/`):
 *   node scripts/sendProductUpdateCampaign.js --dry-run
 *   WEEKLY_SUMMARY_TRIAL_GIFT_DAYS=1 node scripts/sendProductUpdateCampaign.js --confirm
 *   node scripts/sendProductUpdateCampaign.js --confirm --campaign 1.5.6 --require-sessions
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import User from '../models/User.js';
import emailMarketingService, {
  buildProductUpdateCampaignFilter
} from '../services/emailMarketingService.js';
import { getWeeklySummaryTrialGiftDays } from '../constants/subscription.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

function parseCampaignId(argv) {
  const i = argv.findIndex((arg) => arg === '--campaign');
  if (i >= 0 && argv[i + 1]) {
    return String(argv[i + 1]).trim();
  }
  return String(process.env.PRODUCT_UPDATE_CAMPAIGN_ID || '1.5.6').trim();
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const requireMinSessions = process.argv.includes('--require-sessions');
  const campaignId = parseCampaignId(process.argv);
  const confirmed =
    process.argv.includes('--confirm') ||
    process.argv.includes('--yes') ||
    process.env.PRODUCT_UPDATE_CAMPAIGN_CONFIRM === 'true';

  if (!campaignId) {
    console.error('❌ campaignId vacío. Usa --campaign 1.5.6 o PRODUCT_UPDATE_CAMPAIGN_ID.');
    process.exit(1);
  }

  if (!dryRun && !confirmed) {
    console.error(
      'Uso:\n' +
        '  node scripts/sendProductUpdateCampaign.js --dry-run\n' +
        '  WEEKLY_SUMMARY_TRIAL_GIFT_DAYS=1 node scripts/sendProductUpdateCampaign.js --confirm\n' +
        '  node scripts/sendProductUpdateCampaign.js --confirm --campaign 1.5.6\n' +
        '  o: PRODUCT_UPDATE_CAMPAIGN_CONFIRM=true node scripts/sendProductUpdateCampaign.js'
    );
    process.exit(1);
  }

  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI o MONGODB_URI debe estar en .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB\n');

    const giftDays = getWeeklySummaryTrialGiftDays();
    const filter = buildProductUpdateCampaignFilter(campaignId, requireMinSessions);
    const candidates = await User.countDocuments(filter);

    console.log(`📣 Campaña: ${campaignId}`);
    console.log(`   Regalo trial configurado: +${giftDays} día(s)`);
    console.log(`   requireMinSessions: ${requireMinSessions}`);
    console.log(`   Candidatos elegibles (sin enviar aún esta campaña): ${candidates}\n`);

    if (giftDays !== 1) {
      console.warn(
        `⚠️  WEEKLY_SUMMARY_TRIAL_GIFT_DAYS=${giftDays}. Para 1 día gratis usa WEEKLY_SUMMARY_TRIAL_GIFT_DAYS=1 en este run.\n`
      );
    }

    if (dryRun) {
      console.log('✅ --dry-run: no se envió ningún correo.');
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log('📧 Enviando campaña...\n');
    const results = await emailMarketingService.sendProductUpdateCampaignEmails({
      campaignId,
      requireMinSessions
    });

    console.log('📊 Resultado:');
    console.log(`   📣 Campaña: ${results.campaignId}`);
    console.log(`   📅 Semana ISO (marcada en BD): ${results.yearWeekKey ?? '—'}`);
    console.log(`   ✅ Enviados: ${results.sent}`);
    console.log(`   ❌ Fallidos: ${results.failed}`);
    console.log(`   🔄 Procesados: ${results.processed}`);
    console.log(`   🎁 Regalo trial (+${results.trialGiftDays} d): aplicado ${results.trialGiftApplied}, omitido ${results.trialGiftSkipped}, errores ${results.trialGiftErrors}`);

    await mongoose.disconnect();
    console.log('\n✅ Listo');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    logger.error('sendProductUpdateCampaign:', error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

main();
