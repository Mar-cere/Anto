/**
 * Auditoría mailer EN (CLI). Exit 1 si hay problemas.
 * Uso: node backend/scripts/audit-email-en.mjs
 */
import mailer from '../config/mailer.js';
import { buildWeeklySummaryEmailContext } from '../utils/weeklySummaryEmailContext.js';
import { runEmailEnAudit } from '../utils/emailEnAudit.mjs';

const { ok, report } = await runEmailEnAudit(mailer, buildWeeklySummaryEmailContext);
const c = report.counts;

console.log('=== Auditoría email EN ===');
console.log('Claves ES faltantes en tabla EN:', c.missingStringKeys);
console.log('Español en STRINGS.en:', c.spanishInStringTable);
console.log('Fugas ES en plantillas renderizadas:', c.spanishInRender);
console.log('Plantillas EN idénticas a ES:', c.identicalToEs);

const show = (label, arr, n = 5) => {
  if (!arr.length) return;
  console.log(`\n${label} (primeros ${Math.min(n, arr.length)}):`);
  arr.slice(0, n).forEach((s) => {
    console.log(`- ${s.path || s.id}: ${s.text || s.sample || s.marker || s}`);
  });
};

show('Claves faltantes', report.missingStringKeys.map((k) => ({ path: k })));
show('Español en tabla', report.spanishInStringTable);
show('Fugas render', report.spanishInRender);
if (report.identicalToEs.length) {
  console.log('\nIdénticas a ES:', report.identicalToEs.join(', '));
}

process.exit(ok ? 0 : 1);
