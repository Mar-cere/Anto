#!/usr/bin/env node
/**
 * Smoke #88 — activación conductual, plan semanal y sync tareas/hábitos.
 * Uso: node scripts/smoke-ba-device.mjs
 */
import emotionalAnalyzer from '../services/emotionalAnalyzer.js';
import actionSuggestionService, {
  applyBaSuggestionPolicy,
} from '../services/actionSuggestionService.js';
import { buildBaPrefillParams } from '../services/baRecordPrefillService.js';
import { getInterventionCatalogEntry } from '../constants/interventionCatalog.js';
import {
  buildTaskDraftFromBaSlot,
  computeSlotDueDate,
  suggestProductKindForSlot,
} from '../services/behavioralActivationProductBridgeService.js';
import { normalizeWeekStart } from '../services/behavioralActivationWeekPlanService.js';
import {
  BA_BRIDGE_ERROR_CODES,
  buildBaBridgeErrorBody,
} from '../utils/baBridgeErrorResponse.js';
import {
  CHAT_BA_SMOKE_CASES,
  CHAT_BA_SMOKE_CASES_EN,
} from '../tests/fixtures/chatBaSmokeMessages.js';

let failed = 0;

function ok(label, condition, detail = '') {
  if (condition) {
    console.log(`  [OK] ${label}`);
  } else {
    console.log(`  [FAIL] ${label}${detail ? ` — ${detail}` : ''}`);
    failed += 1;
  }
}

console.log('\n=== Smoke activación conductual (#88) ===\n');

const catalog = getInterventionCatalogEntry('behavioral_activation');
ok('Catálogo #127 → BehavioralActivation', catalog?.screen === 'BehavioralActivation');

const weekStart = normalizeWeekStart(new Date());
const pleasantSlot = {
  slotId: 'slot-1',
  dayOffset: 2,
  activityDescription: 'Paseo corto al aire libre',
  activityType: 'pleasant',
};
ok('Sugerencia task para actividad placentera', suggestProductKindForSlot(pleasantSlot) === 'task');
ok('Sugerencia habit para rutina', suggestProductKindForSlot({ ...pleasantSlot, activityType: 'routine' }) === 'habit');

const due = computeSlotDueDate(weekStart, pleasantSlot.dayOffset);
ok('computeSlotDueDate devuelve fecha futura', due instanceof Date && due.getTime() > Date.now());

const taskDraft = buildTaskDraftFromBaSlot({
  slot: pleasantSlot,
  weekStart,
  language: 'es',
});
ok('buildTaskDraftFromBaSlot incluye título y tags BA', taskDraft.title && taskDraft.tags?.includes('ba'));

const conflictBody = buildBaBridgeErrorBody('SLOT_LINK_CONFLICT', 'ocupado');
ok(
  'buildBaBridgeErrorBody expone código estable',
  conflictBody.code === BA_BRIDGE_ERROR_CODES.SLOT_LINK_CONFLICT && conflictBody.success === false,
);

const canonical =
  'Me siento apagado y sin ganas de hacer nada, 6/10. Llevo días sin salir de casa.';
const prefill = buildBaPrefillParams(canonical, 'es');
ok('Prefill chat incluye actividad', Boolean(prefill?.prefillActivityDescription));
ok('Prefill chat incluye ánimo', typeof prefill?.prefillMoodBefore === 'number');

console.log('\n--- Chat: análisis + sugerencias (es/en) ---');
for (const { lang, cases } of [
  { lang: 'es', cases: CHAT_BA_SMOKE_CASES },
  { lang: 'en', cases: CHAT_BA_SMOKE_CASES_EN },
]) {
  console.log(`  · ${lang.toUpperCase()}`);
  for (const {
    id,
    message,
    minIntensity,
    expectBa,
    expectBaFirst,
    expectAbc = false,
    expectAt = false,
  } of cases) {
    const analysis = await emotionalAnalyzer.analyzeEmotion(message);
    const suggestions = actionSuggestionService.generateSuggestions(analysis, {}, {
      userContent: message,
    });
    const ranked = applyBaSuggestionPolicy(suggestions, {
      emotion: analysis.mainEmotion,
      intensityLevel: analysis.intensity >= 8 ? 'high' : analysis.intensity >= 5 ? 'medium' : 'low',
      userContent: message,
    });
    const hasBa = ranked.includes('behavioral_activation');
    const baFirst = ranked[0] === 'behavioral_activation';
    const intensityOk = analysis.intensity >= minIntensity;
    const baOk = expectBa ? hasBa : !hasBa;
    const firstOk = expectBaFirst ? baFirst : true;
    const abcOk = expectAbc ? ranked.includes('abc_record') : true;
    const atOk = expectAt ? ranked.includes('automatic_thought_record') : true;
    const pass = intensityOk && baOk && firstOk && abcOk && atOk;
    ok(`${lang}:${id}`, pass, `emotion=${analysis.mainEmotion} ranked=${ranked.slice(0, 4).join(',')}`);
  }
}

console.log('\nRuta manual en dispositivo: Técnicas → Activación conductual');
console.log('Validar: prefill desde chat, plan semanal, vínculo tarea/hábito, sync al completar\n');

if (failed > 0) {
  console.error(`❌ Smoke BA falló (${failed} checks)\n`);
  process.exit(1);
}
console.log('✅ Smoke BA OK — listo para prueba en dispositivo\n');
process.exit(0);
