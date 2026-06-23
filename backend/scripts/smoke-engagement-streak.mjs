#!/usr/bin/env node
/**
 * Smoke estático — racha de ecosistema (engagement streak).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  applyEngagementSignalForTest,
  mapInterventionIdToEngagementSignal,
  previousDateKey,
} from '../services/engagementStreakService.js';
import { ENGAGEMENT_SIGNAL } from '../utils/engagementStreakWeights.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

const checks = [];

function pass(name) {
  checks.push({ name, ok: true });
}

function fail(name, detail) {
  checks.push({ name, ok: false, detail });
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

// --- Comportamiento en memoria (regresión día 1 → 2) ---
const day1 = applyEngagementSignalForTest({}, ENGAGEMENT_SIGNAL.CHAT_USER_MESSAGE, '2026-06-16');
if (day1.current === 1 && day1.lastQualifiedDateKey === '2026-06-16') {
  pass('día 1: chat califica a 1');
} else {
  fail('día 1: chat califica a 1', `current=${day1.current}`);
}

const broken = { ...day1, current: 0 };
const day2 = applyEngagementSignalForTest(broken, ENGAGEMENT_SIGNAL.CHAT_USER_MESSAGE, '2026-06-17');
if (day2.current === 2 && day2.lastQualifiedDateKey === '2026-06-17') {
  pass('día 2: repara current=0 y sube a 2');
} else {
  fail('día 2: repara current=0 y sube a 2', `current=${day2.current}`);
}

let threeDay = applyEngagementSignalForTest({}, ENGAGEMENT_SIGNAL.CHAT_USER_MESSAGE, '2026-06-15');
threeDay = applyEngagementSignalForTest(threeDay, ENGAGEMENT_SIGNAL.CHAT_USER_MESSAGE, '2026-06-16');
threeDay = applyEngagementSignalForTest(threeDay, ENGAGEMENT_SIGNAL.CHAT_USER_MESSAGE, '2026-06-17');
if (threeDay.current === 3) {
  pass('tres días consecutivos → 3');
} else {
  fail('tres días consecutivos → 3', `current=${threeDay.current}`);
}

const gap = applyEngagementSignalForTest(day1, ENGAGEMENT_SIGNAL.CHAT_USER_MESSAGE, '2026-06-18');
if (gap.current === 1) {
  pass('hueco de un día reinicia a 1');
} else {
  fail('hueco de un día reinicia a 1', `current=${gap.current}`);
}

const rolledOnly = applyEngagementSignalForTest(day1, ENGAGEMENT_SIGNAL.TASK_COMPLETED, '2026-06-17');
if (rolledOnly.current === 1 && rolledOnly.lastQualifiedDateKey === '2026-06-16') {
  pass('rollover sin calificar hoy mantiene racha viva');
} else {
  fail('rollover sin calificar hoy mantiene racha viva');
}

if (previousDateKey('2026-06-17') === '2026-06-16') {
  pass('previousDateKey');
} else {
  fail('previousDateKey');
}

if (
  mapInterventionIdToEngagementSignal('psychoeducation_anxiety') ===
    ENGAGEMENT_SIGNAL.PSYCHOEDUCATION_COMPLETED &&
  mapInterventionIdToEngagementSignal('abc_record') === ENGAGEMENT_SIGNAL.TECHNIQUE_COMPLETED
) {
  pass('mapInterventionIdToEngagementSignal');
} else {
  fail('mapInterventionIdToEngagementSignal');
}

// --- Cableado estático ---
const service = read('backend/services/engagementStreakService.js');
if (
  service.includes('resolveStreakTimezone') &&
  service.includes('todayKeyForUser') &&
  service.includes('rolledToNewDay')
) {
  pass('servicio: timezone unificado y rollover de día');
} else {
  fail('servicio: timezone unificado y rollover de día');
}

if (service.includes('Math.max(state.current || 0, 1)') && service.includes('(state.current || 0) + 1')) {
  pass('servicio: reparación e incremento de current');
} else {
  fail('servicio: reparación e incremento de current');
}

const focus = read('backend/services/dashboardFocusService.js');
if (focus.includes('getEngagementStreak') && focus.includes('engagementStreak,')) {
  pass('dashboardFocus expone engagementStreak');
} else {
  fail('dashboardFocus expone engagementStreak');
}

const chatRoutes = read('backend/routes/chatRoutes.js');
const socket = read('backend/config/socket.js');
if (
  chatRoutes.includes('recordEngagementSignal') &&
  chatRoutes.includes('ENGAGEMENT_SIGNAL.CHAT_USER_MESSAGE') &&
  socket.includes('recordEngagementSignal')
) {
  pass('chat HTTP y socket registran señal');
} else {
  fail('chat HTTP y socket registran señal');
}

for (const [label, rel, signal] of [
  ['taskRoutes', 'backend/routes/taskRoutes.js', 'TASK_COMPLETED'],
  ['habitRoutes', 'backend/routes/habitRoutes.js', 'HABIT_COMPLETED'],
  ['dailyMoodRoutes', 'backend/routes/dailyMoodRoutes.js', 'MOOD_CHECKIN'],
  ['therapeuticTechniquesRoutes', 'backend/routes/therapeuticTechniquesRoutes.js', 'TECHNIQUE_COMPLETED'],
]) {
  const src = read(rel);
  if (src.includes('recordEngagementSignal') && src.includes(`ENGAGEMENT_SIGNAL.${signal}`)) {
    pass(`${label} registra ${signal}`);
  } else {
    fail(`${label} registra ${signal}`);
  }
}

const userModel = read('backend/models/User.js');
if (
  userModel.includes('engagementStreak:') &&
  userModel.includes('lastQualifiedDateKey') &&
  userModel.includes('todayDateKey')
) {
  pass('User.stats.engagementStreak en schema');
} else {
  fail('User.stats.engagementStreak en schema');
}

const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(c.ok ? `  OK  ${c.name}` : ` FAIL ${c.name}${c.detail ? `: ${c.detail}` : ''}`);
}

if (failed.length > 0) {
  console.error(`\nSmoke engagement-streak: ${failed.length} fallo(s)`);
  process.exit(1);
}
console.log('\nSmoke engagement-streak: OK');
process.exit(0);
