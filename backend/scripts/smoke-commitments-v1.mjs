#!/usr/bin/env node
/**
 * Smoke estático compromisos v1 (#202) — sin DB ni OpenAI.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  sanitizeCommitmentPatch,
  sanitizeCommitmentSourceMeta,
  isFollowUpDue,
  FOCUS_VISIBLE_LIMIT,
} from '../services/sessionCommitmentService.js';
import {
  shouldOfferCommitmentProposals,
  isExplicitCommitmentRequest,
} from '../services/chatCommitmentProposalService.js';
import { buildSessionCommitmentPromptSnippet } from '../services/sessionCommitmentPromptSnippet.js';
import { sanitizeProposedCommitments } from '../utils/sanitizeProposedCommitments.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', '..');

const checks = [];

function pass(name) {
  checks.push({ name, ok: true });
}

function fail(name, detail) {
  checks.push({ name, ok: false, detail });
}

if (FOCUS_VISIBLE_LIMIT === 3) {
  pass('foco visible limit = 3');
} else {
  fail('foco visible limit = 3', String(FOCUS_VISIBLE_LIMIT));
}

if (
  sanitizeCommitmentPatch({ label: 'ok', recordFollowUpShown: true, hacker: 1 }).label === 'ok' &&
  sanitizeCommitmentPatch({ label: 'ok', recordFollowUpShown: true, hacker: 1 }).recordFollowUpShown ===
    undefined
) {
  pass('PATCH client-safe sin recordFollowUpShown');
} else {
  fail('PATCH client-safe sin recordFollowUpShown');
}

if (!shouldOfferCommitmentProposals({ isCrisis: true, riskLevel: 'LOW' })) {
  pass('crisis bloquea propuestas');
} else {
  fail('crisis bloquea propuestas');
}

if (isExplicitCommitmentRequest('guárdalo como compromiso de sesión')) {
  pass('detecta pedido explícito de compromiso');
} else {
  fail('detecta pedido explícito de compromiso');
}

const now = Date.now();
if (
  isFollowUpDue(
    {
      status: 'active',
      followUpAnswer: 'pending',
      followUpAt: new Date(now - 1000),
      createdAt: new Date(now - 72 * 60 * 60 * 1000),
      followUpAttempts: 1,
    },
    now,
  ) &&
  !isFollowUpDue(
    {
      status: 'active',
      followUpAnswer: 'pending',
      followUpAt: new Date(now - 1000),
      createdAt: new Date(now - 72 * 60 * 60 * 1000),
      followUpAttempts: 2,
    },
    now,
  )
) {
  pass('isFollowUpDue respeta tope de 2 intentos');
} else {
  fail('isFollowUpDue respeta tope de 2 intentos');
}

const promptSrc = fs.readFileSync(
  path.join(root, 'backend/services/sessionCommitmentPromptSnippet.js'),
  'utf8',
);
if (!promptSrc.includes('markCommitmentFollowUpShown')) {
  pass('prompt snippet no marca follow-up en planificación');
} else {
  fail('prompt snippet no marca follow-up en planificación');
}

const finalizeSrc = fs.readFileSync(
  path.join(root, 'backend/services/chatTurnEnhancementsService.js'),
  'utf8',
);
if (
  finalizeSrc.includes('commitmentFollowUpCommitmentId') &&
  finalizeSrc.includes('markCommitmentFollowUpShown')
) {
  pass('follow-up chat se marca en finalize');
} else {
  fail('follow-up chat se marca en finalize');
}

const chatRoutesSrc = fs.readFileSync(path.join(root, 'backend/routes/chatRoutes.js'), 'utf8');
if (chatRoutesSrc.includes('proposedProductActions.length > 0')) {
  pass('conflicto product actions vs commitments');
} else {
  fail('conflicto product actions vs commitments');
}

const dashSrc = fs.readFileSync(
  path.join(root, 'frontend/src/components/DashboardFocusCard.js'),
  'utf8',
);
if (dashSrc.includes('item.followUpDue === true') && dashSrc.includes('FOCUS_COMMITMENT_OMIT')) {
  pass('dashboard follow-up estricto + omitir');
} else {
  fail('dashboard follow-up estricto + omitir');
}

const sanitized = sanitizeProposedCommitments([
  { id: '1', label: 'Retomar respiración' },
  { id: '2', label: 'Otro' },
]);
if (sanitized.length === 1 && sanitized[0].label === 'Retomar respiración') {
  pass('sanitizeProposedCommitments max 1');
} else {
  fail('sanitizeProposedCommitments max 1', JSON.stringify(sanitized));
}

const snippet = await buildSessionCommitmentPromptSnippet({
  userId: null,
  riskLevel: 'LOW',
  isCrisis: false,
});
if (snippet.snippet === null && snippet.commitmentId === null) {
  pass('prompt snippet sin userId');
} else {
  fail('prompt snippet sin userId');
}

const weeklySrc = fs.readFileSync(
  path.join(root, 'backend/services/sessionCommitmentWeeklyNudgeService.js'),
  'utf8',
);
if (weeklySrc.includes('processWeeklyCommitmentNudges')) {
  pass('servicio push semanal compromisos');
} else {
  fail('servicio push semanal compromisos');
}

const schedulerSrc = fs.readFileSync(
  path.join(root, 'backend/services/notificationScheduler.js'),
  'utf8',
);
if (
  schedulerSrc.includes('processWeeklyCommitmentNudges') &&
  schedulerSrc.includes('COMMITMENT_WEEKLY_CHECK_INTERVAL_MS')
) {
  pass('scheduler intervalo compromisos semanales');
} else {
  fail('scheduler intervalo compromisos semanales');
}

const metricsRoutesSrc = fs.readFileSync(path.join(root, 'backend/routes/metricsRoutes.js'), 'utf8');
if (metricsRoutesSrc.includes("router.post('/commitment'")) {
  pass('POST /api/metrics/commitment');
} else {
  fail('POST /api/metrics/commitment');
}

const finalizeV11 = fs.readFileSync(
  path.join(root, 'backend/services/chatTurnEnhancementsService.js'),
  'utf8',
);
if (finalizeV11.includes('persistProposedCommitmentsOnMessage')) {
  pass('persistencia metadata proposedCommitments');
} else {
  fail('persistencia metadata proposedCommitments');
}

const greetingSrc = fs.readFileSync(
  path.join(root, 'frontend/src/utils/chatWelcomeGreeting.js'),
  'utf8',
);
if (greetingSrc.includes('reconstructPersistedCommitmentProposals')) {
  pass('reconstrucción tarjetas compromiso en chat');
} else {
  fail('reconstrucción tarjetas compromiso en chat');
}

const commitmentSvcSrc = fs.readFileSync(
  path.join(root, 'backend/services/sessionCommitmentService.js'),
  'utf8',
);
if (commitmentSvcSrc.includes('validateOwnedProductSourceMeta')) {
  pass('validación ownership task/habit en chat_action');
} else {
  fail('validación ownership task/habit en chat_action');
}

const schedulerSrc2 = fs.readFileSync(
  path.join(root, 'backend/services/notificationScheduler.js'),
  'utf8',
);
if (schedulerSrc2.includes('commitmentWeeklyReminders !== true')) {
  pass('push semanal exige opt-in en scheduler');
} else {
  fail('push semanal exige opt-in en scheduler');
}

const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(c.ok ? `✅ ${c.name}` : `❌ ${c.name}${c.detail ? `: ${c.detail}` : ''}`);
}

if (failed.length > 0) {
  console.error(`\nSmoke compromisos v1: ${failed.length} fallo(s)`);
  process.exit(1);
}

console.log('\nSmoke compromisos v1: OK');
process.exit(0);
