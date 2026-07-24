/**
 * Smoke wiring soft landing post-crisis (#225).
 * No requiere Mongo ni red: valida exports, ventana 48 h y copy.
 */
import assert from 'node:assert/strict';
import {
  POST_CRISIS_WINDOW_MS,
  CRISIS_COOLDOWN_METRIC_TYPES,
} from '../utils/postCrisisWindowGuard.js';
import {
  buildSoftLandingStripPayload,
  buildSoftLandingHomeMessage,
  buildSoftLandingPromptSnippet,
  SOFT_LANDING_VERSION,
} from '../constants/softLandingPostCrisisCopy.js';
import { FIRST_FOLLOW_UP_HOURS_BY_RISK } from '../services/crisisFollowUp/constants.js';
import { generateFollowUpMessage } from '../services/crisisFollowUp/messageGenerator.js';
import features from '../config/features.js';

assert.equal(POST_CRISIS_WINDOW_MS, 48 * 60 * 60 * 1000);
assert.deepEqual(CRISIS_COOLDOWN_METRIC_TYPES.sort(), [
  'crisis_hard_stop',
  'crisis_protocol_exit',
].sort());
assert.equal(features.softLandingPostCrisis, true);

const stripEs = buildSoftLandingStripPayload({ language: 'es' });
const stripEn = buildSoftLandingStripPayload({ language: 'en' });
assert.equal(stripEs.active, true);
assert.equal(stripEs.version, SOFT_LANDING_VERSION);
assert.ok(stripEs.techniques.some((t) => t.screen === 'BreathingExercise'));
assert.ok(stripEn.validation.length > 10);

assert.match(buildSoftLandingHomeMessage({ language: 'es' }), /Estoy aquí/);
assert.match(buildSoftLandingHomeMessage({ language: 'en' }), /I am here/);
assert.match(buildSoftLandingPromptSnippet({ language: 'es' }), /Soft landing|soft landing/i);

assert.equal(FIRST_FOLLOW_UP_HOURS_BY_RISK.HIGH, 48);
assert.equal(FIRST_FOLLOW_UP_HOURS_BY_RISK.MEDIUM, 48);

const msg = generateFollowUpMessage(
  { riskLevel: 'LOW', detectedAt: new Date(Date.now() - 50 * 3600000) },
  { language: 'es' },
);
assert.match(msg, /Estoy aquí|cuando quieras/i);

console.log('smoke-soft-landing-v1: OK');
