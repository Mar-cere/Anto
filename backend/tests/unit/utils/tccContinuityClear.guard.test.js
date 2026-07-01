/**
 * Guardas de regresión: chip «Retoma tu proceso» tras borrar conversación.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

function readSource(relPath) {
  return fs.readFileSync(path.join(workspaceRoot, relPath), 'utf8');
}

describe('tccContinuityClear guards', () => {
  const hookSrc = readSource('frontend/src/hooks/useChatScreen.js');
  const clearSrc = readSource('backend/services/conversationClearService.js');
  const continuitySrc = readSource('backend/services/chatTccContinuityService.js');
  const chatServiceSrc = readSource('frontend/src/services/chatService.js');
  const chatRoutesSrc = readSource('backend/routes/chatRoutes.js');
  const turnUtilsSrc = readSource('frontend/src/utils/chatTurnUtils.js');

  it('useChatScreen invalida peticiones y vacía mensajes al borrar', () => {
    expect(hookSrc).toMatch(/tccContinuityRequestIdRef\.current \+= 1/);
    expect(hookSrc).toMatch(/setMessages\(\[\]\)/);
    expect(hookSrc).toMatch(/messagesRef\.current = \[\]/);
    expect(hookSrc).toMatch(/setTccContinuityItems\(\[\]\)/);
  });

  it('loadTccContinuity no aplica respuestas obsoletas ni sin turnos del usuario', () => {
    expect(hookSrc).toMatch(/requestId !== tccContinuityRequestIdRef\.current/);
    expect(hookSrc).toMatch(/hasNonemptyUserTurns\(messagesRef\.current\)/);
  });

  it('fetchTccContinuity exige conversationId válido antes de llamar al API', () => {
    expect(chatServiceSrc).toMatch(/test\(cid\)\) return \[\]/);
    expect(chatServiceSrc).toMatch(/CHAT_TCC_CONTINUITY/);
  });

  it('servidor exige conversationId y contenido de usuario para continuidad', () => {
    expect(continuitySrc).toMatch(/if \(!conversationId \|\| !userId\) return false/);
    expect(continuitySrc).toMatch(/content: \{ \$regex: \/\\S\/ \}/);
  });

  it('borrado completo limpia crisis, check-in suave y TCC lite en conversación', () => {
    expect(clearSrc).toMatch(/crisisProtocolState/);
    expect(clearSrc).toMatch(/softCrisisCheckInState/);
    expect(clearSrc).toMatch(/tccLiteState/);
    expect(chatRoutesSrc).toMatch(/resetConversationSessionState\(conversationId/);
    expect(chatRoutesSrc).toMatch(/userId: req\.user\._id/);
  });

  it('chatTurnUtils centraliza detección de turnos con contenido', () => {
    expect(turnUtilsSrc).toMatch(/export function hasNonemptyUserTurns/);
    expect(turnUtilsSrc).toMatch(/quickReplies/);
  });
});
