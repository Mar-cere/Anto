#!/usr/bin/env node
/**
 * Smoke estático Release 1.4.6 (Bloque C) — sin DB ni red.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  buildPublicHealthSnapshot,
  getHealthHttpStatus,
} from '../services/healthProbeService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

const checks = [];

function pass(name) {
  checks.push({ name, ok: true });
}

function fail(name, detail) {
  checks.push({ name, ok: false, detail });
}

const snap = buildPublicHealthSnapshot({ version: '1.4.6' });
if (snap.dependencies?.atlas && snap.workers?.weeklyPatternInsight !== undefined) {
  pass('health probe snapshot público');
} else {
  fail('health probe snapshot público', JSON.stringify(snap));
}

if (getHealthHttpStatus({ status: 'degraded' }) === 200) {
  pass('health HTTP 200 en degraded');
} else {
  fail('health HTTP 200 en degraded');
}

if (getHealthHttpStatus({ status: 'unavailable' }) === 503) {
  pass('health HTTP 503 en unavailable');
} else {
  fail('health HTTP 503 en unavailable');
}

const envDoc = path.join(root, 'docs/ENV.md');
if (fs.existsSync(envDoc) && fs.readFileSync(envDoc, 'utf8').includes('ATLAS_VECTOR_SEARCH_ENABLED')) {
  pass('docs/ENV.md presente');
} else {
  fail('docs/ENV.md presente');
}

const sentryClient = path.join(root, 'frontend/src/utils/sentry.js');
if (fs.existsSync(sentryClient) && fs.readFileSync(sentryClient, 'utf8').includes('captureChatError')) {
  pass('sentry cliente util');
} else {
  fail('sentry cliente util');
}

const maestroE2e = path.join(root, 'frontend/e2e/maestro/login-chat-send.yaml');
if (fs.existsSync(maestroE2e) && fs.readFileSync(maestroE2e, 'utf8').includes('chat-send-button')) {
  pass('e2e maestro login-chat-send');
} else {
  fail('e2e maestro login-chat-send');
}

const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(c.ok ? `✅ ${c.name}` : `❌ ${c.name}${c.detail ? `: ${c.detail}` : ''}`);
}

if (failed.length > 0) {
  console.error(`\nSmoke 1.4.6: ${failed.length} fallo(s)`);
  process.exit(1);
}

console.log('\nSmoke 1.4.6: OK');
