#!/usr/bin/env node
/**
 * Smoke estático Release 1.4.5 (Bloque B) — sin DB ni OpenAI.
 */
import {
  sanitizeCommitmentSourceMeta,
} from '../services/sessionCommitmentService.js';
import { failsClinicalGuardrails } from '../utils/clinicalContentGuardrails.js';

const checks = [];

function pass(name) {
  checks.push({ name, ok: true });
}

function fail(name, detail) {
  checks.push({ name, ok: false, detail });
}

const meta = sanitizeCommitmentSourceMeta({
  interventionId: 'abc-123',
  extra: 'no debe filtrarse',
  nested: { x: 1 },
});
if (meta?.interventionId === 'abc-123' && Object.keys(meta).length === 1) {
  pass('compromisos sourceMeta client-safe');
} else {
  fail('compromisos sourceMeta client-safe', JSON.stringify(meta));
}

if (sanitizeCommitmentSourceMeta({ foo: 'bar' }) === null) {
  pass('compromisos sourceMeta vacío sin interventionId');
} else {
  fail('compromisos sourceMeta vacío sin interventionId');
}

if (failsClinicalGuardrails('tienes depresión') && !failsClinicalGuardrails('caminar 10 minutos')) {
  pass('guardrails clínicos en labels de compromiso');
} else {
  fail('guardrails clínicos en labels de compromiso');
}

const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(c.ok ? `✅ ${c.name}` : `❌ ${c.name}${c.detail ? `: ${c.detail}` : ''}`);
}

if (failed.length > 0) {
  console.error(`\nSmoke 1.4.5: ${failed.length} fallo(s)`);
  process.exit(1);
}

console.log('\nSmoke 1.4.5: OK');
