#!/usr/bin/env node
/**
 * Smoke estático Release 1.5.0 (Bloque D) — sin DB ni red.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { features } from '../config/features.js';
import {
  shouldHardStopCrisisLlm,
  buildHardStopCrisisAssistantContent,
  buildCrisisHardStopClientPayload,
} from '../services/crisisHardStopService.js';
import { buildPersonalPatternRagSnippet, isPersonalPatternRagEnabled } from '../services/personalPatternRagService.js';
import { buildAtlasVectorSearchPipeline } from '../services/topicFreeVectorSearchService.js';
import { buildCrisisSessionInsightCopy } from '../utils/sessionInsightCopy.js';
import { getEmergencyLines } from '../constants/emergencyNumbers.js';
import {
  buildOpenaiCrisisContext,
  shouldIncludeCrisisInOpenaiContext,
  generateCrisisSystemPrompt,
  generateCrisisMediumResponseConstraints,
} from '../constants/crisis.js';
import { buildOpenaiEnhancementSnippets } from '../services/chatTurnEnhancementsService.js';
import {
  sanitizeCrisisLlmResponse,
  detectInappropriateCrisisContent,
} from '../utils/crisisResponseSafety.js';
import metricsService from '../services/metricsService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

const checks = [];

function pass(name) {
  checks.push({ name, ok: true });
}

function fail(name, detail) {
  checks.push({ name, ok: false, detail });
}

if (typeof features.crisisHardStop === 'boolean' && typeof features.personalPatternRag === 'boolean') {
  pass('feature flags crisisHardStop y personalPatternRag');
} else {
  fail('feature flags crisisHardStop y personalPatternRag');
}

if (
  shouldHardStopCrisisLlm({
    enabled: true,
    riskLevel: 'HIGH',
    messageContent: 'quiero morir',
  }) &&
  shouldHardStopCrisisLlm({
    enabled: true,
    riskLevel: 'WARNING',
    messageContent: 'quiero morir',
  })
) {
  pass('crisis hard-stop HIGH + léxico explícito');
} else {
  fail('crisis hard-stop HIGH + léxico explícito');
}

const hardStop = buildHardStopCrisisAssistantContent({ riskLevel: 'HIGH', country: 'ESPANA' });
if (hardStop && hardStop.length > 80 && hardStop.includes('112') && !/plan de seguridad/i.test(hardStop)) {
  pass('buildHardStopCrisisAssistantContent');
} else {
  fail('buildHardStopCrisisAssistantContent');
}

const chileLines = getEmergencyLines({ preferences: { regionCountry: 'CL' } });
if (chileLines?.EMERGENCY === '133' && chileLines?.SUICIDE_PREVENTION?.includes('600')) {
  pass('getEmergencyLines unificado (regionCountry CL)');
} else {
  fail('getEmergencyLines unificado (regionCountry CL)');
}

const memoryPipeline = buildAtlasVectorSearchPipeline({
  userId: '507f1f77bcf86cd799439011',
  queryVector: [0.1, 0.2],
  eventTypes: ['memory_index'],
  interventionId: 'personal-pattern',
});
if (
  memoryPipeline[0].$vectorSearch.filter.eventType?.$in?.includes('memory_index') &&
  memoryPipeline[0].$vectorSearch.filter.interventionId === 'personal-pattern'
) {
  pass('pipeline Atlas memory_index');
} else {
  fail('pipeline Atlas memory_index');
}

const serverJs = fs.readFileSync(path.join(root, 'backend/server.js'), 'utf8');
if (serverJs.includes("const APP_VERSION = '1.5.0'")) {
  pass('APP_VERSION 1.5.0 en server.js');
} else {
  fail('APP_VERSION 1.5.0 en server.js');
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'backend/package.json'), 'utf8'));
if (pkg.version === '1.5.0' && pkg.scripts['smoke:release-1.5.0']) {
  pass('backend package 1.5.0 + smoke script');
} else {
  fail('backend package 1.5.0 + smoke script');
}

const requiredFiles = [
  'backend/services/personalPatternRagService.js',
  'backend/services/crisisHardStopService.js',
  'backend/tests/unit/services/personalPatternRagService.test.js',
  'backend/tests/unit/services/crisisHardStopService.test.js',
];
for (const rel of requiredFiles) {
  if (fs.existsSync(path.join(root, rel))) {
    pass(`existe ${rel}`);
  } else {
    fail(`existe ${rel}`);
  }
}

const hardStopPayload = buildCrisisHardStopClientPayload('es');
if (hardStopPayload.suggestions.length === 0 && hardStopPayload.tccLite.active === false) {
  pass('hard-stop sin sugerencias ni TCC');
} else {
  fail('hard-stop sin sugerencias ni TCC');
}

if (
  shouldIncludeCrisisInOpenaiContext('WARNING', { isCrisis: false }) &&
  buildOpenaiCrisisContext({ riskLevel: 'WARNING', userMessage: 'no aguanto' })?.riskLevel ===
    'WARNING'
) {
  pass('crisis WARNING llega al contexto OpenAI');
} else {
  fail('crisis WARNING llega al contexto OpenAI');
}

const blockedSnippets = buildOpenaiEnhancementSnippets(
  {
    suggestionPlan: { psychoeducationPromptSnippet: 'x' },
    activeTccProtocolsPromptSnippet: 'y',
    tccLitePlan: { promptSnippet: 'z' },
  },
  { blockCrisisExtras: true },
);
if (
  !blockedSnippets.psychoeducationPromptSnippet &&
  !blockedSnippets.activeTccProtocolsPromptSnippet &&
  !blockedSnippets.tccLitePromptSnippet
) {
  pass('snippets terapéuticos bloqueados en crisis');
} else {
  fail('snippets terapéuticos bloqueados en crisis');
}

const mediumPrompt = generateCrisisSystemPrompt('MEDIUM', 'GENERAL');
const mediumConstraints = generateCrisisMediumResponseConstraints('es');
if (
  mediumPrompt.includes('FORMATO DE RESPUESTA OBLIGATORIO (MEDIUM)') &&
  mediumConstraints.includes('PROHIBIDO') &&
  !generateCrisisSystemPrompt('HIGH', 'GENERAL').includes('FORMATO DE RESPUESTA OBLIGATORIO')
) {
  pass('constraints MEDIUM en prompt de crisis');
} else {
  fail('constraints MEDIUM en prompt de crisis');
}

const sanitizeSample = sanitizeCrisisLlmResponse(
  'Te escucho. Hagamos grounding juntos. ¿Estás a salvo?',
);
if (
  sanitizeSample.wasSanitized &&
  detectInappropriateCrisisContent('Hagamos grounding juntos').includes('grounding_invite')
) {
  pass('sanitizer post-LLM crisis');
} else {
  fail('sanitizer post-LLM crisis');
}

const routingSnap = metricsService.getCrisisRoutingSnapshot();
if (
  routingSnap &&
  typeof routingSnap.hardStop === 'number' &&
  typeof routingSnap.llmPath === 'number' &&
  typeof routingSnap.sanitizedResponses === 'number' &&
  routingSnap.hardStopByRiskLevel &&
  routingSnap.llmPathByTransport
) {
  pass('métricas crisisRouting en memoria');
} else {
  fail('métricas crisisRouting en memoria');
}

const opsSnap = metricsService.getCrisisRoutingOpsSnapshot();
if (
  opsSnap?.routing?.hardStopSharePct != null ||
  (opsSnap.routing.hardStop === 0 && opsSnap.routing.llmPath === 0)
) {
  pass('métricas crisisRouting ops snapshot');
} else {
  fail('métricas crisisRouting ops snapshot');
}

const snippetSample = await buildPersonalPatternRagSnippet({
  userId: null,
  userContent: 'x',
});
if (snippetSample === null) {
  pass('RAG snippet null sin userId');
} else {
  fail('RAG snippet null sin userId');
}

const healthProbe = fs.readFileSync(path.join(root, 'backend/services/healthProbeService.js'), 'utf8');
const metricsServiceSrc = fs.readFileSync(path.join(root, 'backend/services/metricsService.js'), 'utf8');
if (
  healthProbe.includes('chatFeatures') &&
  healthProbe.includes('buildChatFeaturesSnapshot') &&
  healthProbe.includes('crisisRouting') &&
  metricsServiceSrc.includes('sanitizedByTransport') &&
  metricsServiceSrc.includes('sanitizedByRiskLevel') &&
  metricsServiceSrc.includes('getCrisisRoutingOpsSnapshot')
) {
  pass('health detallado expone chatFeatures');
} else {
  fail('health detallado expone chatFeatures');
}

const healthRoutesSrc = fs.readFileSync(path.join(root, 'backend/routes/healthRoutes.js'), 'utf8');
const crisisBgSrc = fs.readFileSync(
  path.join(root, 'backend/services/crisisBackgroundActionsService.js'),
  'utf8',
);
const crisisBgCtxSrc = fs.readFileSync(
  path.join(root, 'backend/services/crisisBackgroundContextService.js'),
  'utf8',
);
if (
  healthRoutesSrc.includes('/crisis-routing') &&
  crisisBgSrc.includes('runCrisisBackgroundActions') &&
  crisisBgSrc.includes('shouldRunCrisisBackgroundActions') &&
  crisisBgCtxSrc.includes('resolveCrisisRiskAndContext')
) {
  pass('acciones segundo plano crisis + endpoint ops');
} else {
  fail('acciones segundo plano crisis + endpoint ops');
}

const ragService = fs.readFileSync(path.join(root, 'backend/services/personalPatternRagService.js'), 'utf8');
if (ragService.includes('isSensitiveForPersonalMemory') && ragService.includes('sensitive_content')) {
  pass('RAG blindaje contenido sensible');
} else {
  fail('RAG blindaje contenido sensible');
}

if (isPersonalPatternRagEnabled() === false) {
  pass('personalPatternRag opt-in (off sin env)');
} else {
  fail('personalPatternRag opt-in (off sin env)', 'debería estar off en smoke sin env');
}

const crisisInsightCopy = buildCrisisSessionInsightCopy({
  language: 'es',
  riskTier: 'high',
  intensity: 8,
});
if (crisisInsightCopy?.headline?.includes('seguridad')) {
  pass('session insight copy crisis HIGH');
} else {
  fail('session insight copy crisis HIGH');
}

const sessionInsightSrc = fs.readFileSync(
  path.join(root, 'backend/services/sessionInsightService.js'),
  'utf8',
);
if (
  sessionInsightSrc.includes('buildCrisisSessionInsightCopy') &&
  sessionInsightSrc.includes('resolveCrisisRiskForUserTurn') &&
  sessionInsightSrc.includes('thoughtPattern = crisisSession') &&
  sessionInsightSrc.includes('crisisTier:')
) {
  pass('session insight blindaje crisis en servicio');
} else {
  fail('session insight blindaje crisis en servicio');
}

const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(c.ok ? `  OK  ${c.name}` : ` FAIL ${c.name}${c.detail ? `: ${c.detail}` : ''}`);
}

if (failed.length > 0) {
  console.error(`\nSmoke 1.5.0: ${failed.length} fallo(s)`);
  process.exit(1);
}
console.log('\nSmoke 1.5.0: OK');
process.exit(0);
