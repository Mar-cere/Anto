#!/usr/bin/env node
/**
 * Smoke estático Release 1.4.4 — sin DB ni OpenAI.
 */
import { isWeeklyInsightLlmEnabled, validateLlmInsightPayload } from '../services/weeklyInsightLlmService.js';
import { toClientAbcPatterns, buildAbcMacroPatterns } from '../services/abcMacroPatternService.js';
import { sanitizeDigitalPhenotypePayload } from '../services/digitalPhenotypeService.js';
import { isAtlasVectorSearchEnabled } from '../services/topicFreeVectorSearchService.js';

import { isChatObservationalContextBlocked } from '../utils/chatObservationalContext.js';

const checks = [];

function pass(name) {
  checks.push({ name, ok: true });
}

function fail(name, detail) {
  checks.push({ name, ok: false, detail });
}

try {
  const good = validateLlmInsightPayload({
    headline: 'Patrones de tu semana',
    insights: [{ type: 'x', label: 'Sueño', detail: 'Conviene notar el ritmo.' }],
    disclaimers: [],
  });
  if (good?.insights?.length === 1) pass('LLM guardrails aceptan payload válido');
  else fail('LLM guardrails aceptan payload válido', 'sin insights');
} catch (e) {
  fail('LLM guardrails aceptan payload válido', e.message);
}

try {
  const bad = validateLlmInsightPayload({
    headline: 'Diagnóstico clínico',
    insights: [{ type: 'x', label: 'a', detail: 'b' }],
  });
  if (bad === null) pass('LLM guardrails rechazan diagnóstico');
  else fail('LLM guardrails rechazan diagnóstico');
} catch (e) {
  fail('LLM guardrails rechazan diagnóstico', e.message);
}

try {
  const client = toClientAbcPatterns(
    buildAbcMacroPatterns(
      [
        { activatingEvent: 'Trabajo', beliefs: 'x', emotions: 'y', consequence: 'z', emotionIntensity: 5 },
        { activatingEvent: 'Trabajo', beliefs: 'a', emotions: 'b', consequence: 'c', emotionIntensity: 6 },
      ],
      { language: 'es' },
    ),
  );
  if (client.length === 1 && !client[0].beliefSamples) pass('ABC API client-safe');
  else fail('ABC API client-safe', JSON.stringify(client));
} catch (e) {
  fail('ABC API client-safe', e.message);
}

try {
  const row = sanitizeDigitalPhenotypePayload(
    { dayKey: '2026-06-02', steps: 100, source: 'healthkit' },
    { fromClient: true },
  );
  if (row?.source === 'stub') pass('Fenotipo cliente no confía en healthkit');
  else fail('Fenotipo cliente no confía en healthkit', row?.source);
} catch (e) {
  fail('Fenotipo cliente no confía en healthkit', e.message);
}

pass(`weeklyInsightLlm flag=${isWeeklyInsightLlmEnabled()}`);
pass(`atlasVectorSearch flag=${isAtlasVectorSearchEnabled()}`);
if (isChatObservationalContextBlocked('HIGH') && !isChatObservationalContextBlocked('LOW')) {
  pass('chat observational gating');
} else {
  fail('chat observational gating');
}

const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(c.ok ? `✅ ${c.name}` : `❌ ${c.name}${c.detail ? `: ${c.detail}` : ''}`);
}

if (failed.length > 0) {
  console.error(`\nSmoke 1.4.4: ${failed.length} fallo(s)`);
  process.exit(1);
}

console.log('\nSmoke 1.4.4: OK');
process.exit(0);
