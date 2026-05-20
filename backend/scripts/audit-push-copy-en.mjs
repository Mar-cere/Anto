/**
 * Auditoría push EN (CLI). Exit 1 si hay problemas.
 * Uso: node backend/scripts/audit-push-copy-en.mjs
 */
import { pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { runPushEnAudit } from '../utils/pushCopyEnAudit.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const enPath = join(__dirname, '..', 'services', 'pushNotificationCopyPools.en.js');
const { PUSH_NOTIFICATION_COPY_EN: EN } = await import(pathToFileURL(enPath).href);

const { ok, report } = await runPushEnAudit(EN);
const c = report.counts;

console.log('=== Auditoría push EN ===');
console.log('Español residual:', c.spanish);
console.log('Fallbacks || en español:', c.spanishFallbacks);
console.log('Fugas "Sample":', c.sampleLeak);
console.log('trialExpiring sin rama days===1:', report.missingDaysBranch);
console.log('"3 days" fijo en trial:', c.hardcodedDays);
console.log('Horas fijas en followUp (fuente):', c.hardcodedHours);
console.log('Patrones problemáticos:', c.bad);
console.log('Placeholders faltantes vs ES:', c.placeholderMismatches);
console.log('Claves ES ausentes en EN:', c.missingKeys);

const show = (label, arr, n = 5) => {
  if (!arr.length) return;
  console.log(`\n${label} (primeros ${Math.min(n, arr.length)}):`);
  arr.slice(0, n).forEach((s) => console.log(`- ${s.path || s.key}: ${s.text || s.missing || s.label}`));
};

show('Fallbacks || ES', report.spanishFallbacks);
show('Español', report.spanish);
show('Sample', report.sampleLeak);
if (report.placeholderMismatches.length) show('Placeholders', report.placeholderMismatches);

process.exit(ok ? 0 : 1);
