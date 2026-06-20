/**
 * Blindaje: propuestas productivas en chat (tareas/hábitos) — menos ruido, sin avisos de tope.
 */
import fs from 'fs';
import path from 'path';

const FRONTEND_SRC = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(FRONTEND_SRC, '..', '..');

function readSrc(relativePath) {
  return fs.readFileSync(path.join(FRONTEND_SRC, relativePath), 'utf8');
}

function readRepo(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
}

describe('chatProductActions guard', () => {
  it('useChatScreen no inserta mensajes product_action_status en el hilo', () => {
    const src = readSrc('hooks/useChatScreen.js');
    expect(src).toMatch(/productActionStatus\?\.askFirst/);
    expect(src).not.toMatch(/type:\s*['"]product_action_status['"]/);
  });

  it('backend suprime check-ins positivos sin ancla accionable', () => {
    const src = readRepo('backend/services/chatProductActionProposalService.js');
    expect(src).toMatch(/isLowValueEmotionalCheckout/);
    expect(src).toMatch(/POSITIVE_EMOTIONAL_CHECKOUT/);
    expect(src).toMatch(/isLowValueEmotionalCheckout\(content\)/);
  });

  it('backend no expone aviso de tope/cooldown al cliente cuando bloquea', () => {
    const src = readRepo('backend/services/conversationProductProposalCapService.js');
    expect(src).toMatch(/SILENT_PRODUCT_ACTION_STATUS/);
    expect(src).not.toMatch(/reason:\s*['"]cap['"]/);
    expect(src).not.toMatch(/reason:\s*['"]cooldown['"]/);
  });

  it('shouldSuppressLowRelevanceSuggestions incluye check-in positivo breve', () => {
    const src = readRepo('backend/routes/chat/chatContextAnalysis.js');
    expect(src).toMatch(/positiveCheckout/);
    expect(src).toMatch(/shouldSuppressLowRelevanceSuggestions/);
  });
});
