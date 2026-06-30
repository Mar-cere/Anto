#!/usr/bin/env node
/**
 * Smoke protocolo crisis v1 (#93, #10, #205) — wiring estático + unidades clave.
 * Complementa el checklist manual en docs/SMOKE_DISPOSITIVO_CRISIS_I18N.md
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  buildCrisisProtocolTransparency,
  getCrisisProtocolCopy,
} from '../constants/crisisProtocolCopy.js';
import {
  shouldHardStopCrisisLlm,
  buildCrisisHardStopClientPayload,
} from '../services/crisisHardStopService.js';
import {
  evaluateCrisisProtocolTurn,
  normalizeCrisisProtocolState,
} from '../services/crisisProtocolService.js';
import {
  validateContactAlertOfferConfirmation,
  isValidConversationIdForOffer,
} from '../services/crisisContactAlertOfferService.js';
import { buildCrisisResourcesClientPayload } from '../services/crisisResourcesService.js';
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

console.log('\n=== Smoke protocolo crisis (#93 / #10 / #205) ===\n');

const esBlocks = buildCrisisProtocolTransparency({ language: 'es' });
const enBlocks = buildCrisisProtocolTransparency({ language: 'en' });
ok('T1–T4 transparencia ES', esBlocks.length === 4 && esBlocks.every((b) => b.text?.length > 10));
ok('T1–T4 transparencia EN', enBlocks.length === 4 && enBlocks.every((b) => b.text?.length > 10));
ok(
  'T5 aviso contactos (opcional)',
  buildCrisisProtocolTransparency({ language: 'es', showContactAlertNotice: true }).length === 5,
);

const esCopy = getCrisisProtocolCopy('es');
const enCopy = getCrisisProtocolCopy('en');
ok('copy oferta alerta es/en', Boolean(esCopy.offerContactAlert) && Boolean(enCopy.offerContactAlert));
ok('copy post-alerta es/en', Boolean(esCopy.postContactAlertNotice && enCopy.postContactAlertNotice));
ok('copy crisis ES sin voseo', !hasSpanishVoseo(esCopy.transparencyWhy));

const hardStop = shouldHardStopCrisisLlm({
  enabled: true,
  riskLevel: 'HIGH',
  messageContent: 'quiero morir',
});
ok('hard-stop HIGH + léxico', hardStop === true);

const clientPayload = buildCrisisHardStopClientPayload('en');
ok(
  'hard-stop client payload sin sugerencias',
  Array.isArray(clientPayload?.suggestions) &&
    clientPayload.suggestions.length === 0 &&
    clientPayload?.tccLite?.active === false,
);

const protocolTurn = evaluateCrisisProtocolTurn({
  previousState: null,
  riskLevel: 'MEDIUM',
  messageContent: 'no quiero seguir',
});
ok(
  'protocolo activa en MEDIUM',
  protocolTurn.crisisProtocolState?.active === true,
);

const exitTurn = evaluateCrisisProtocolTurn({
  previousState: normalizeCrisisProtocolState({ active: true, stableUserTurns: 0 }),
  riskLevel: 'LOW',
  messageContent: 'ya estoy bien, gracias',
});
ok(
  'salida protocolo con mensaje explícito de bienestar',
  exitTurn.crisisProtocolExit != null && exitTurn.crisisProtocolState?.active === false,
);

ok('offerId inválido rechazado', isValidConversationIdForOffer('not-a-mongo-id') === false);
ok(
  'validación oferta sin conversación',
  validateContactAlertOfferConfirmation({
    offerId: 'x',
    conversation: null,
    userId: '507f1f77bcf86cd799439011',
  }).ok === false,
);

const resources = buildCrisisResourcesClientPayload({
  preferences: { regionCountry: 'ES' },
  language: 'en',
  showContactAlertNotice: false,
});
ok(
  'recursos crisis con transparencia',
  Array.isArray(resources?.transparency) &&
    resources.transparency.length >= 4 &&
    Array.isArray(resources?.items) &&
    resources.items.length > 0,
);

const userRoutes = fs.readFileSync(path.join(root, 'backend/routes/userRoutes.js'), 'utf8');
ok(
  'rutas alert-from-chat + dismiss',
  userRoutes.includes('alert-from-chat') && userRoutes.includes('dismiss-alert-from-chat'),
);

const chatRoutes = fs.readFileSync(path.join(root, 'backend/routes/chatRoutes.js'), 'utf8');
ok(
  'chat integra crisisProtocolState',
  chatRoutes.includes('crisisProtocolState') && chatRoutes.includes('crisisTurnClientExtras'),
);

const apiTs = fs.readFileSync(path.join(root, 'frontend/src/config/api.ts'), 'utf8');
ok(
  'frontend endpoints alerta chat',
  apiTs.includes('EMERGENCY_CONTACTS_ALERT_FROM_CHAT') &&
    apiTs.includes('EMERGENCY_CONTACTS_DISMISS_ALERT_FROM_CHAT'),
);

const strip = fs.readFileSync(
  path.join(root, 'frontend/src/components/chat/CrisisResourcesStrip.js'),
  'utf8',
);
ok(
  'CrisisResourcesStrip transparencia + límites IA',
  strip.includes('resources.transparency') &&
    strip.includes('AiLimitInfoButton') &&
    strip.includes('AI_LIMIT_TOPIC.CRISIS'),
);

const chatItem = fs.readFileSync(
  path.join(root, 'frontend/src/components/chat/ChatMessageItem.js'),
  'utf8',
);
ok(
  'oferta alerta contactos en chat',
  chatItem.includes('emergency_contact_alert_offer') &&
    chatItem.includes('EMERGENCY_CONTACT_ALERT_OFFER'),
);

const protocolDoc = fs.readFileSync(path.join(root, 'docs/PROTOCOLO_CRISIS_V1.md'), 'utf8');
ok('spec PROTOCOLO_CRISIS_V1', protocolDoc.includes('## 8. Checklist de cierre'));

const unitTests = [
  'backend/tests/unit/services/crisisProtocolService.test.js',
  'backend/tests/unit/services/crisisContactAlertOfferService.test.js',
  'backend/tests/unit/services/crisisHardStopService.test.js',
];
for (const rel of unitTests) {
  ok(`existe ${path.basename(rel)}`, fs.existsSync(path.join(root, rel)));
}

console.log(
  failed
    ? `\nSmoke protocolo crisis: ${failed} fallo(s)\n`
    : '\nSmoke protocolo crisis: OK (ejecutar checklist manual en dispositivo)\n',
);
process.exit(failed ? 1 : 0);
