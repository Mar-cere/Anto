/**
 * Paridad SSE ↔ Socket.IO para streaming por chunks (#128 / #59).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const workspaceRoot = path.resolve(root, '..');

function readSource(relPath) {
  return fs.readFileSync(path.join(workspaceRoot, relPath), 'utf8');
}

describe('chat transport streaming parity (#128)', () => {
  const socketSrc = readSource('backend/config/socket.js');
  const routesSrc = readSource('backend/routes/chatRoutes.js');
  const eventsSrc = readSource('frontend/src/constants/chatSocketEvents.js');
  const wsSrc = readSource('frontend/src/services/websocketService.js');
  const chatServiceSrc = readSource('frontend/src/services/chatService.js');

  it('backend expone message:chunk y generarRespuestaStream en socket y SSE', () => {
    expect(socketSrc).toMatch(/MESSAGE_CHUNK:\s*'message:chunk'/);
    expect(socketSrc).toMatch(/generarRespuestaStream/);
    expect(socketSrc).toMatch(/chatStreamingMetrics/);
    expect(socketSrc).toMatch(/streaming_first_chunk/);
    expect(routesSrc).toMatch(/generarRespuestaStream/);
    expect(routesSrc).toMatch(/streaming_first_chunk/);
  });

  it('frontend escucha message:chunk y propaga onChunk', () => {
    expect(eventsSrc).toMatch(/MESSAGE_CHUNK:\s*'message:chunk'/);
    expect(wsSrc).toMatch(/MESSAGE_CHUNK/);
    expect(wsSrc).toMatch(/onChunk/);
    expect(chatServiceSrc).toMatch(/onChunk/);
    expect(chatServiceSrc).not.toMatch(/if \(content && onChunk\) onChunk\(content\)/);
  });
});
