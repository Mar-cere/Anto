#!/usr/bin/env node
/**
 * Smoke #86 + #212 — autorregistro ABC, prefill chat y ciclo macro.
 * Uso: node scripts/smoke-abc-device.mjs
 */
import emotionalAnalyzer from '../services/emotionalAnalyzer.js';
import actionSuggestionService, {
  applyAbcSuggestionPolicy,
} from '../services/actionSuggestionService.js';
import { buildAbcPrefillParams } from '../services/abcRecordPrefillService.js';
import { getInterventionCatalogEntry } from '../constants/interventionCatalog.js';
import {
  buildAbcMacroPatterns,
  toClientAbcCyclePatterns,
  toClientAbcPatterns,
} from '../services/abcMacroPatternService.js';
import { buildAbcGuardErrorBody, ABC_GUARD_ERROR_CODES } from '../utils/abcGuardErrorResponse.js';
import { buildRecentAbcChatSnippet } from '../services/recentAbcChatContextService.js';
import {
  CHAT_ABC_SMOKE_CASES,
  CHAT_ABC_SMOKE_CASES_EN,
} from '../tests/fixtures/chatAbcSmokeMessages.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const smokeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let failed = 0;

function ok(label, condition, detail = '') {
  if (condition) {
    console.log(`  [OK] ${label}`);
  } else {
    console.log(`  [FAIL] ${label}${detail ? ` — ${detail}` : ''}`);
    failed += 1;
  }
}

console.log('\n=== Smoke autorregistro ABC (#86 / #212) ===\n');

const catalog = getInterventionCatalogEntry('abc_record');
ok('Catálogo #127 → AbcRecord', catalog?.screen === 'AbcRecord');

const canonical =
  'Me siento triste, 7/10. Noto que siempre pienso lo peor después de discutir con mi pareja.';
const prefill = buildAbcPrefillParams(canonical, 'es');
ok('Prefill chat incluye situación A', Boolean(prefill?.prefillActivatingEvent));
ok('Prefill chat incluye pensamiento B', Boolean(prefill?.prefillBeliefs));

const macroFixture = [
  {
    activatingEvent: 'Reunión con el jefe',
    beliefs: 'No voy a poder',
    emotions: 'ansiedad',
    consequence: 'Evité hablar',
    emotionIntensity: 7,
  },
  {
    activatingEvent: 'Reunion con el jefe',
    beliefs: 'Me van a juzgar',
    emotions: 'miedo',
    consequence: 'Me quedé callado',
    emotionIntensity: 8,
  },
];
const patterns = buildAbcMacroPatterns(macroFixture, { language: 'es' });
ok('buildAbcMacroPatterns agrupa recurrentes', patterns.length === 1 && patterns[0].count === 2);

const summaryClient = toClientAbcPatterns(patterns);
ok('toClientAbcPatterns omite cycle', summaryClient[0] && !summaryClient[0].cycle);

const cycleClient = toClientAbcCyclePatterns(patterns);
ok(
  'toClientAbcCyclePatterns expone ciclo A→B→C',
  cycleClient[0]?.cycle?.trigger && cycleClient[0].cycle.thoughts?.length > 0,
);

const cycleVisualSrc = fs.readFileSync(
  path.join(smokeRoot, '../frontend/src/components/abc/AbcMacroCycleVisual.js'),
  'utf8',
);
ok('lienzo interactivo #212 (patas expandibles)', /Pressable/.test(cycleVisualSrc) && /interventionHint/.test(cycleVisualSrc));

const guardBody = buildAbcGuardErrorBody('macroInvalidRange', 'rango inválido');
ok(
  'buildAbcGuardErrorBody código estable',
  guardBody.code === ABC_GUARD_ERROR_CODES.MACRO_INVALID_RANGE,
);

ok('buildRecentAbcChatSnippet sin userId devuelve null', (await buildRecentAbcChatSnippet({})) === null);

console.log('\n--- Chat: análisis + sugerencias (es/en) ---');
for (const { lang, cases } of [
  { lang: 'es', cases: CHAT_ABC_SMOKE_CASES },
  { lang: 'en', cases: CHAT_ABC_SMOKE_CASES_EN },
]) {
  console.log(`  · ${lang.toUpperCase()}`);
  for (const { id, message, minIntensity, expectAbc, expectAbcFirst = false } of cases) {
    const analysis = await emotionalAnalyzer.analyzeEmotion(message);
    const suggestions = actionSuggestionService.generateSuggestions(analysis, {}, {
      userContent: message,
    });
    const ranked = applyAbcSuggestionPolicy(suggestions, {
      emotion: analysis.mainEmotion,
      intensityLevel:
        analysis.intensity >= 8 ? 'high' : analysis.intensity >= 5 ? 'medium' : 'low',
      userContent: message,
    });
    const hasAbc = ranked.includes('abc_record');
    const abcFirst = ranked[0] === 'abc_record';
    const intensityOk = analysis.intensity >= minIntensity;
    const abcOk = expectAbc ? hasAbc : !hasAbc;
    const firstOk = expectAbcFirst ? abcFirst : true;
    const pass = intensityOk && abcOk && firstOk;
    ok(`${lang}:${id}`, pass, `emotion=${analysis.mainEmotion} ranked=${ranked.slice(0, 4).join(',')}`);
  }
}

console.log('\nRuta manual en dispositivo: Técnicas → Autorregistro ABC');
console.log('Validar: prefill desde chat, ciclo macro A→B→C interactivo, export y registros recientes\n');

if (failed > 0) {
  console.error(`❌ Smoke ABC falló (${failed} checks)\n`);
  process.exit(1);
}
console.log('✅ Smoke ABC OK — listo para prueba en dispositivo\n');
process.exit(0);
