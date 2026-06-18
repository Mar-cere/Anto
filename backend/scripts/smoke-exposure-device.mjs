#!/usr/bin/env node
/**
 * Smoke #87 + #190 — jerarquía exposición, guardas anti-saltos y chat.
 * Uso: node scripts/smoke-exposure-device.mjs
 */
import emotionalAnalyzer from '../services/emotionalAnalyzer.js';
import actionSuggestionService, {
  applyExposureSuggestionPolicy,
  shouldBoostExposureSuggestion,
} from '../services/actionSuggestionService.js';
import {
  buildExposurePrefillParams,
  enrichSuggestionsWithExposurePrefill,
} from '../services/exposurePlanPrefillService.js';
import { getInterventionCatalogEntry } from '../constants/interventionCatalog.js';
import {
  evaluateCompleteExposureStep,
  evaluateLogExposureAttempt,
} from '../utils/exposurePlanGuards.js';
import { buildExposureGuardErrorBody } from '../utils/exposurePlanGuardResponse.js';
import { exposurePlanApiCopy } from '../utils/exposurePlanApiCopy.js';
import {
  CHAT_EXPOSURE_SMOKE_CASES,
  CHAT_EXPOSURE_SMOKE_CASES_EN,
} from '../tests/fixtures/chatExposureSmokeMessages.js';

let failed = 0;

function ok(label, condition, detail = '') {
  if (condition) {
    console.log(`  [OK] ${label}`);
  } else {
    console.log(`  [FAIL] ${label}${detail ? ` — ${detail}` : ''}`);
    failed += 1;
  }
}

function planFixture(overrides = {}) {
  return {
    currentStepIndex: 0,
    steps: [
      { status: 'in_progress', attempts: [], description: 'Paso 1' },
      { status: 'pending', attempts: [], description: 'Paso 2' },
    ],
    ...overrides,
  };
}

console.log('\n=== Smoke exposición (#87) + anti-saltos (#190) ===\n');

const catalog = getInterventionCatalogEntry('exposure_hierarchy');
ok('Catálogo #127 → ExposureHierarchy', catalog?.screen === 'ExposureHierarchy');

const blockedComplete = evaluateCompleteExposureStep(planFixture(), 0);
ok('#190 rechaza completar sin intento', blockedComplete.ok === false && blockedComplete.errorKey === 'stepNeedsAttempt');

const blockedSkip = evaluateCompleteExposureStep(
  planFixture({
    steps: [
      { status: 'in_progress', attempts: [{ peakSuds: 60, endSuds: 30 }] },
      { status: 'pending', attempts: [{ peakSuds: 50, endSuds: 20 }] },
    ],
  }),
  1,
);
ok('#190 rechaza saltar paso (stepLocked)', blockedSkip.ok === false && blockedSkip.errorKey === 'stepLocked');

const blockedFutureAttempt = evaluateLogExposureAttempt(planFixture(), 1);
ok('#190 rechaza intento en paso futuro', blockedFutureAttempt.ok === false && blockedFutureAttempt.errorKey === 'stepLocked');

const allowed = evaluateCompleteExposureStep(
  planFixture({
    steps: [{ status: 'in_progress', attempts: [{ peakSuds: 70, endSuds: 40 }] }, { status: 'pending', attempts: [] }],
  }),
  0,
);
ok('Permite completar paso actual con intento', allowed.ok === true);

const canonical =
  'Tengo ansiedad social, 6/10. Evito hablar en reuniones porque me da mucho miedo quedar mal.';
const prefill = buildExposurePrefillParams(canonical, 'es');
ok('Prefill chat incluye objetivo', Boolean(prefill?.prefillGoal));
ok('Prefill chat incluye ≥2 pasos', (prefill?.prefillSteps?.length || 0) >= 2);

const enriched = enrichSuggestionsWithExposurePrefill(
  [{ id: 'exposure_hierarchy', screen: 'ExposureHierarchy' }],
  canonical,
  'es',
);
ok('Sugerencia exposure con params fromChat', enriched[0]?.params?.fromChat === true);

const guardBody = buildExposureGuardErrorBody('stepLocked', exposurePlanApiCopy('es'));
ok('API guarda code STEP_LOCKED', guardBody.code === 'STEP_LOCKED');

console.log('\n--- Chat: análisis + sugerencias (es/en) ---');
for (const { lang, cases } of [
  { lang: 'es', cases: CHAT_EXPOSURE_SMOKE_CASES },
  { lang: 'en', cases: CHAT_EXPOSURE_SMOKE_CASES_EN },
]) {
  console.log(`  · ${lang.toUpperCase()}`);
  for (const {
    id,
    message,
    minIntensity,
    expectExposure,
    expectExposureFirst,
    expectRegulation = false,
  } of cases) {
    const analysis = await emotionalAnalyzer.analyzeEmotion(message);
    const suggestions = actionSuggestionService.generateSuggestions(analysis, {}, {
      userContent: message,
    });
    const ranked = applyExposureSuggestionPolicy(suggestions, {
      emotion: analysis.mainEmotion,
      intensityLevel: analysis.intensity >= 8 ? 'high' : analysis.intensity >= 5 ? 'medium' : 'low',
      userContent: message,
    });
    const hasExposure = ranked.includes('exposure_hierarchy');
    const exposureFirst = ranked[0] === 'exposure_hierarchy';
    const hasRegulation =
      ranked.includes('breathing_exercise') || ranked.includes('grounding_technique');
    const intensityOk = analysis.intensity >= minIntensity;
    const exposureOk = expectExposure ? hasExposure : !hasExposure;
    const firstOk = expectExposureFirst ? exposureFirst : true;
    const regulationOk = expectRegulation ? hasRegulation : true;
    const boostOk = expectExposure ? shouldBoostExposureSuggestion(message) : true;
    const pass = intensityOk && exposureOk && firstOk && regulationOk && boostOk;
    ok(`${lang}:${id}`, pass, `emotion=${analysis.mainEmotion} ranked=${ranked.slice(0, 3).join(',')}`);
  }
}

console.log('\nRuta manual en dispositivo: Técnicas → Jerarquía de exposición');
console.log('Validar: prefill desde chat, registrar SUDS, confirmación al avanzar, bloqueo de saltos\n');

if (failed > 0) {
  console.error(`❌ Smoke exposición falló (${failed} checks)\n`);
  process.exit(1);
}
console.log('✅ Smoke exposición OK — listo para prueba en dispositivo\n');
process.exit(0);
