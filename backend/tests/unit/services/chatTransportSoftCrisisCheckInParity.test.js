/**
 * Paridad SSE ↔ Socket.IO para check-in crisis suave (#19).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const workspaceRoot = path.resolve(root, '..');

function readSource(relPath) {
  return fs.readFileSync(path.join(workspaceRoot, relPath), 'utf8');
}

describe('chat transport soft crisis check-in parity (#19)', () => {
  const socketSrc = readSource('backend/config/socket.js');
  const routesSrc = readSource('backend/routes/chatRoutes.js');
  const extrasSrc = readSource('backend/services/crisisTurnClientExtrasService.js');
  const resourcesSrc = readSource('backend/services/crisisResourcesService.js');
  const chatServiceSrc = readSource('frontend/src/services/chatService.js');
  const socketPayloadSrc = readSource('frontend/src/utils/chatSocketTurnPayload.js');
  const userRoutesSrc = readSource('backend/routes/userRoutes.js');
  const apiSrc = readSource('frontend/src/config/api.ts');

  it('backend expone softCrisisCheckIn en socket, SSE y extras', () => {
    expect(socketSrc).toMatch(/softCrisisCheckIn/);
    expect(routesSrc).toMatch(/softCrisisCheckIn/);
    expect(extrasSrc).toMatch(/evaluateSoftCrisisCheckInTurn/);
    expect(extrasSrc).toMatch(/dismissSoftCrisisCheckInForConversation/);
    expect(resourcesSrc).toMatch(/hasBatterySignal/);
    expect(resourcesSrc).toMatch(/crisisProtocolActive/);
  });

  it('frontend propaga softCrisisCheckIn en socket y guest', () => {
    expect(socketPayloadSrc).toMatch(/softCrisisCheckIn/);
    expect(chatServiceSrc).toMatch(/softCrisisCheckIn/);
  });

  it('ruta dismiss check-in suave en userRoutes y api.ts', () => {
    expect(userRoutesSrc).toMatch(/dismiss-soft-check-in-from-chat/);
    expect(apiSrc).toMatch(/DISMISS_SOFT_CHECK_IN_FROM_CHAT/);
  });

  it('exclusividad: extras anula soft si hay panel crisis', () => {
    expect(extrasSrc).toContain('crisisResources != null ? null : softCheckInResult.softCrisisCheckIn');
  });
});
