/**
 * Guardas de paridad: post-procesado de cierre de tramo en todos los transportes.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

function readSource(relPath) {
  return fs.readFileSync(path.join(workspaceRoot, relPath), 'utf8');
}

describe('sessionClosureTransport guards', () => {
  const openaiSrc = readSource('backend/services/openaiService.js');
  const hintsSrc = readSource('backend/services/sessionRetentionHints.js');
  const hookSrc = readSource('frontend/src/hooks/useChatScreen.js');

  it('openaiService propaga sessionPhase e historial al post-procesado stream', () => {
    expect(openaiSrc).toMatch(/sessionPhase: contexto\.sessionPhase/);
    expect(openaiSrc).toMatch(/conversationHistory: contexto\.safetyHistory \|\| contexto\.history/);
    expect(openaiSrc).toMatch(/stripPrematureSessionClosurePhrases/);
  });

  it('sessionRetentionHints centraliza supresión de cierre en crisis/pánico', () => {
    expect(hintsSrc).toMatch(/shouldSuppressSessionClosure/);
    expect(hintsSrc).toMatch(/hasActiveCrisisRecoveryInThread/);
    expect(hintsSrc).toMatch(/stripRepeatedSessionClosurePhrase/);
  });

  it('useChatScreen prioriza contenido saneado del servidor en onDone', () => {
    expect(hookSrc).toMatch(/pendingChunk = ''/);
    expect(hookSrc).toMatch(/content: payload\.content/);
  });
});
