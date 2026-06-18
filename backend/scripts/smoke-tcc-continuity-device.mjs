#!/usr/bin/env node
/**
 * Smoke continuidad chat ↔ ejercicios TCC (BA, exposición, AT, ABC).
 */
import {
  buildChatTccContinuity,
  sanitizeContinuityItems,
} from '../services/chatTccContinuityService.js';
import { tccContinuityCopy } from '../utils/tccContinuityCopy.js';

let failed = 0;

function ok(label, condition, detail = '') {
  if (condition) {
    console.log(`  [OK] ${label}`);
  } else {
    console.log(`  [FAIL] ${label}${detail ? ` — ${detail}` : ''}`);
    failed += 1;
  }
}

console.log('\n=== Smoke continuidad chat ↔ ejercicios TCC ===\n');

const copyEs = tccContinuityCopy('es');
const copyEn = tccContinuityCopy('en');
ok('Copy ES incluye títulos BA/ABC', Boolean(copyEs.baToday && copyEs.abcRecentTitle));
ok('Copy EN incluye exposure', Boolean(copyEn.exposureTitle));

const sanitized = sanitizeContinuityItems([
  {
    id: 'ba:s1',
    kind: 'behavioral_activation',
    interventionId: 'behavioral_activation',
    title: 'Hoy',
    subtitle: 'Caminar',
    screen: 'BehavioralActivation',
    params: { openWeekSlotId: 's1' },
    icon: '🚶',
  },
  {
    id: 'bad',
    kind: 'unknown',
    title: 'x',
    screen: 'Nowhere',
  },
]);
ok('sanitizeContinuityItems filtra kinds inválidos', sanitized.length === 1);

const empty = await buildChatTccContinuity({ userId: null });
ok('buildChatTccContinuity sin userId devuelve vacío', empty.items.length === 0);

console.log('\nRuta manual: Chat → strip «Retoma tu proceso» → Abrir BA/ABC/AT/Exposición\n');

if (failed > 0) {
  console.error(`❌ Smoke continuidad TCC falló (${failed} checks)\n`);
  process.exit(1);
}
console.log('✅ Smoke continuidad TCC OK\n');
process.exit(0);
