#!/usr/bin/env node
/**
 * Smoke WAI post-sesión (#98): constantes, elegibilidad, copy i18n, rutas.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  SESSION_WAI_AXIS_KEYS,
  SESSION_WAI_MIN_USER_CHARS,
  SESSION_WAI_MIN_USER_TURNS,
} from '../constants/sessionAllianceFeedback.js';
import {
  isSessionWaiExcludedFromInsight,
  meetsSessionWaiThreshold,
} from '../services/sessionAllianceFeedbackService.js';
import { chatApiCopy } from '../utils/chatApiCopy.js';
import { hasSpanishVoseo } from '../utils/copyToneGuards.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', '..');

let failed = 0;

function ok(label, condition, detail = '') {
  if (condition) {
    console.log(`  [OK] ${label}`);
  } else {
    console.log(`  [FAIL] ${label}${detail ? ` — ${detail}` : ''}`);
    failed += 1;
  }
}

console.log('\n=== Smoke session WAI (#98) ===\n');

ok('4 ejes WAI', SESSION_WAI_AXIS_KEYS.length === 4);
ok('umbral turnos >= 3', SESSION_WAI_MIN_USER_TURNS >= 3);
ok('umbral chars >= 80', SESSION_WAI_MIN_USER_CHARS >= 80);

ok('excluye crisisTier', isSessionWaiExcludedFromInsight({ eligible: true, crisisTier: 'high' }));
ok(
  'excluye crisis_recovered',
  isSessionWaiExcludedFromInsight({ eligible: true, sessionPhase: 'crisis_recovered' }),
);
ok('excluye fase acute', isSessionWaiExcludedFromInsight({ eligible: true, sessionPhase: 'acute' }));
ok(
  'acepta sesión normal sustantiva',
  !isSessionWaiExcludedFromInsight({ eligible: true, sessionPhase: 'default' }) &&
    meetsSessionWaiThreshold({ userTurns: 3, userChars: 80 }),
);

const esCopy = chatApiCopy('es');
const enCopy = chatApiCopy('en');
for (const key of [
  'sessionWaiNotEligible',
  'sessionWaiAlreadyRecorded',
  'sessionWaiScoresInvalid',
  'sessionWaiSubmitError',
  'sessionWaiSkipError',
  'rateLimitSessionWai',
]) {
  ok(`chatApiCopy es/en ${key}`, Boolean(esCopy[key] && enCopy[key]));
}
ok('chatApiCopy es sin voseo sessionWai', !hasSpanishVoseo(esCopy.sessionWaiSubmitError));

const chatRoutes = fs.readFileSync(path.join(root, 'backend/routes/chatRoutes.js'), 'utf8');
ok(
  'rutas session-wai submit/skip + limiter',
  chatRoutes.includes('session-wai/submit') &&
    chatRoutes.includes('session-wai/skip') &&
    chatRoutes.includes('sessionWaiLimiter'),
);
ok(
  'session-insight incluye sessionWai',
  chatRoutes.includes('buildSessionWaiClientPayload'),
);

const insightService = fs.readFileSync(
  path.join(root, 'backend/services/sessionInsightService.js'),
  'utf8',
);
ok('insight expone userChars', insightService.includes('userChars'));

const esJs = fs.readFileSync(path.join(root, 'frontend/src/constants/translations/es.js'), 'utf8');
const enJs = fs.readFileSync(path.join(root, 'frontend/src/constants/translations/en.js'), 'utf8');
for (const key of [
  'SESSION_WAI',
  'AXIS_HEARD',
  'AXIS_SAFE',
  'AXIS_USEFUL',
  'AXIS_NO_PRESSURE',
  'WAI_REMINDER_TITLE',
]) {
  ok(`frontend i18n ${key}`, esJs.includes(key) && enJs.includes(key));
}

const chatItem = fs.readFileSync(
  path.join(root, 'frontend/src/components/chat/ChatMessageItem.js'),
  'utf8',
);
ok('thumbs eliminados del chat UI', !chatItem.includes('thumbs-up'));

console.log(failed ? `\nSmoke session WAI: ${failed} fallo(s)\n` : '\nSmoke session WAI: OK\n');
process.exit(failed ? 1 : 0);
