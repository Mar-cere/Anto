#!/usr/bin/env node
/**
 * Smoke home dashboard: check-in diario, copy neutro y foco.
 */
import { DAILY_MOOD_VALUES } from '../models/DailyMoodCheckIn.js';
import { formatCalendarDateKeyInTz } from '../services/dailyMoodCheckInService.js';
import {
  buildDailyMoodPromptSnippet,
  getDailyMoodCopy,
  toClientDailyMoodCheckIn,
} from '../utils/dailyMoodCopy.js';
import { dailyMoodApiCopy } from '../utils/dailyMoodApiCopy.js';
import { hasSpanishVoseo } from '../utils/copyToneGuards.mjs';

let failed = 0;

function ok(label, condition, detail = '') {
  if (condition) {
    console.log(`  [OK] ${label}`);
  } else {
    console.log(`  [FAIL] ${label}${detail ? ` — ${detail}` : ''}`);
    failed += 1;
  }
}

console.log('\n=== Smoke dashboard / check-in diario ===\n');

ok('DAILY_MOOD_VALUES cubre 4 estados', DAILY_MOOD_VALUES.length === 4);

const dateKey = formatCalendarDateKeyInTz(new Date('2026-06-17T12:00:00.000Z'), 'UTC');
ok('dateKey YYYY-MM-DD', /^\d{4}-\d{2}-\d{2}$/.test(dateKey));

for (const mood of DAILY_MOOD_VALUES) {
  const es = getDailyMoodCopy(mood, 'es');
  const en = getDailyMoodCopy(mood, 'en');
  ok(`copy ${mood} es/en`, Boolean(es?.label && en?.label));
  ok(
    `copy ${mood} es sin voseo`,
    !hasSpanishVoseo(es.acknowledgment) && !hasSpanishVoseo(es.antoSnippet),
  );
}

const client = toClientDailyMoodCheckIn(
  { mood: 'anxious', dateKey, source: 'dashboard', updatedAt: new Date() },
  'es',
);
ok('toClientDailyMoodCheckIn localiza ansioso', client.label === 'Ansioso' && client.suggestChat);

const snippet = buildDailyMoodPromptSnippet({ mood: 'tired' }, 'es');
ok('snippet chat incluye check-in interno', /check-in del día/i.test(snippet));

const apiEs = dailyMoodApiCopy('es');
const apiEn = dailyMoodApiCopy('en');
ok('apiCopy es/en paridad', apiEs.invalidMood && apiEn.invalidMood);
ok('apiCopy es sin voseo', !hasSpanishVoseo(apiEs.saveError));

console.log('\nRuta manual: Home → elegir ánimo → CTA chat → foco actualizado\n');

if (failed > 0) {
  console.error(`❌ Smoke dashboard falló (${failed} checks)\n`);
  process.exit(1);
}
console.log('✅ Smoke dashboard OK\n');
process.exit(0);
