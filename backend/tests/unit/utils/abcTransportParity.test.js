/**
 * Paridad ABC (#86 / #212): chat ↔ pantalla ↔ macro-patterns.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function readSource(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

describe('ABC transport parity (#86 / #212)', () => {
  const abcRoutesSrc = readSource('routes/abcRecordRoutes.js');
  const screenSrc = readSource('../frontend/src/screens/techniques/AbcRecordScreen.js');
  const cardSrc = readSource('../frontend/src/components/abc/AbcMacroPatternsCard.js');

  it('rutas ABC exponen macro-patterns con detalle cycle', () => {
    expect(abcRoutesSrc).toMatch(/macro-patterns/);
    expect(abcRoutesSrc).toMatch(/toClientAbcCyclePatterns/);
    expect(abcRoutesSrc).toMatch(/buildAbcGuardErrorBody/);
  });

  it('pantalla ABC integra ciclo macro y prefill', () => {
    expect(screenSrc).toMatch(/AbcMacroPatternsCard/);
    expect(screenSrc).toMatch(/showCycleVisual/);
    expect(screenSrc).toMatch(/parseAbcRecordRouteParams/);
  });

  it('tarjeta macro soporta visual de ciclo', () => {
    expect(cardSrc).toMatch(/AbcMacroCycleVisual/);
    expect(cardSrc).toMatch(/detail.*cycle|showCycleVisual/);
    expect(cardSrc).toMatch(/interactive/);
    expect(cardSrc).toMatch(/resolveAbcApiErrorMessage/);
  });

  it('lienzo interactivo #212 con patas expandibles', () => {
    const visualSrc = readSource('../frontend/src/components/abc/AbcMacroCycleVisual.js');
    const copySrc = readSource('../frontend/src/components/abc/abcMacroCycleCopy.js');
    expect(visualSrc).toMatch(/Pressable/);
    expect(visualSrc).toMatch(/getAbcMacroCycleInterventionHint/);
    expect(copySrc).toMatch(/interventionB/);
  });

  it('chat usa continuidad ABC reciente (#212)', () => {
    const chatEnhanceSrc = readSource('services/chatTurnEnhancementsService.js');
    const promptSrc = readSource('services/openai/openaiPromptBuilder.js');
    expect(chatEnhanceSrc).toMatch(/buildRecentAbcChatSnippet/);
    expect(promptSrc).toMatch(/recentAbcPromptSnippet/);
  });
});
