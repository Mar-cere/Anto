/**
 * Paridad continuidad chat ↔ ejercicios TCC.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function readSource(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

describe('TCC continuity transport parity', () => {
  const routesSrc = readSource('routes/chatRoutes.js');
  const serviceSrc = readSource('services/chatTccContinuityService.js');
  const chatServiceSrc = readSource('../frontend/src/services/chatService.js');
  const hookSrc = readSource('../frontend/src/hooks/useChatScreen.js');
  const stripSrc = readSource('../frontend/src/components/chat/TccContinuityStrip.js');

  it('ruta GET /tcc-continuity expone items y telemetría shown', () => {
    expect(routesSrc).toMatch(/tcc-continuity/);
    expect(routesSrc).toMatch(/buildChatTccContinuity/);
    expect(routesSrc).toMatch(/recordContinuityItemsShown/);
  });

  it('servicio cubre BA, exposición, AT y ABC', () => {
    expect(serviceSrc).toMatch(/behavioral_activation/);
    expect(serviceSrc).toMatch(/exposure_hierarchy/);
    expect(serviceSrc).toMatch(/automatic_thought_record/);
    expect(serviceSrc).toMatch(/abc_record/);
    expect(serviceSrc).toMatch(/sanitizeContinuityItems/);
  });

  it('cliente chat consume items y dismiss persistente', () => {
    expect(chatServiceSrc).toMatch(/fetchTccContinuity/);
    expect(chatServiceSrc).toMatch(/data\?\.data\?\.items/);
    expect(hookSrc).toMatch(/TccContinuityStrip|loadTccContinuity/);
    expect(hookSrc).toMatch(/tccContinuityDismissStorage|persistDismissedContinuityId/);
    expect(stripSrc).toMatch(/onDismiss/);
  });

  it('blindaje tras borrar: invalidación en vuelo y carga tras init', () => {
    expect(hookSrc).toMatch(/tccContinuityRequestIdRef/);
    expect(hookSrc).toMatch(/await initializeConversation\(\)/);
    expect(hookSrc).toMatch(/await loadTccContinuity(?:Ref\.current)?\(\)/);
    expect(hookSrc).toMatch(/hasNonemptyUserTurns/);
    expect(hookSrc).toMatch(/setMessages\(\[\]\)/);
    expect(serviceSrc).toMatch(/conversationHasUserMessages/);
    expect(serviceSrc).toMatch(/\$regex: \/\\S\//);
  });
});
