#!/usr/bin/env node
/**
 * Smoke streaming / TTFT (#59, #168) — wiring estático.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  buildStreamingTtftMetrics,
  streamingTtftMetricPayload,
} from '../utils/chatStreamingMetrics.js';
import metricsService from '../services/metricsService.js';

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

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

console.log('\n=== Smoke streaming / TTFT (#59) ===\n');

const metrics = buildStreamingTtftMetrics({
  startTime: 0,
  preLlmEndAt: 300,
  firstChunkAt: 800,
});
ok('buildStreamingTtftMetrics', metrics?.ttftMs === 800 && metrics?.preLlmMs === 300);
ok('streamingTtftMetricPayload', streamingTtftMetricPayload(metrics).modelTtftMs === 500);

const chatRoutes = read('backend/routes/chatRoutes.js');
ok('chatRoutes importa chatStreamingMetrics', chatRoutes.includes('chatStreamingMetrics'));
ok('chatRoutes registra preLlmEndAt', chatRoutes.includes('preLlmEndAt'));
ok('chatRoutes SSE stream=true', chatRoutes.includes("req.query.stream === 'true'"));

const socketSrc = read('backend/config/socket.js');
ok('socket MESSAGE_CHUNK', socketSrc.includes("MESSAGE_CHUNK: 'message:chunk'"));
ok('socket generarRespuestaStream', socketSrc.includes('generarRespuestaStream'));
ok('socket TTFT métricas', socketSrc.includes('streaming_first_chunk'));

const socketEvents = read('frontend/src/constants/chatSocketEvents.js');
ok('frontend MESSAGE_CHUNK', socketEvents.includes("MESSAGE_CHUNK: 'message:chunk'"));

const wsSrc = read('frontend/src/services/websocketService.js');
ok('websocket filtra conversationId en chunks', wsSrc.includes('expectedConversationId'));
ok('socket chunk sintético sin deltas', socketSrc.includes('synthetic: true'));

const metricsSrc = read('backend/services/metricsService.js');
ok('metricsService preLlmMsSamples', metricsSrc.includes('preLlmMsSamples'));
ok('metricsService modelTtftMsSamples', metricsSrc.includes('modelTtftMsSamples'));

const healthShape = metricsService.inMemoryMetrics.chatUsage;
ok('health in-memory ttft arrays', Array.isArray(healthShape.preLlmMsSamples));

const chatService = read('frontend/src/services/chatService.js');
ok('chatService socket-first + SSE fallback', chatService.includes('sendMessageViaSocket') && chatService.includes('postChatSseWithXHR'));

const sseStream = read('frontend/src/utils/chatSseStream.js');
ok('chatSseStream AbortSignal', sseStream.includes('signal') && sseStream.includes('ABORTED'));

const sloMonitor = read('backend/services/chatLatencySloMonitorService.js');
ok('SLO monitor p95 (#67)', sloMonitor.includes('calcPercentile'));

ok('test chatStreamingMetrics', fs.existsSync(path.join(root, 'backend/tests/unit/utils/chatStreamingMetrics.test.js')));
ok('test generarRespuestaStream', fs.existsSync(path.join(root, 'backend/tests/unit/services/openaiService.generarRespuestaStream.test.js')));
ok('test chatSseStream abort', read('frontend/src/utils/__tests__/chatSseStream.test.js').includes('AbortSignal'));
ok('doc smoke dispositivo', fs.existsSync(path.join(root, 'docs/SMOKE_DISPOSITIVO_STREAMING.md')));

console.log(failed === 0 ? '\nSmoke streaming: OK\n' : `\nSmoke streaming: ${failed} fallo(s)\n`);
process.exit(failed === 0 ? 0 : 1);
