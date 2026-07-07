/**
 * Blindaje: iconos vectoriales en insight de sesión (sin emojis en iOS).
 */
import fs from 'fs';
import path from 'path';

const FRONTEND_SRC = path.resolve(__dirname, '..', '..');

function readSrc(relativePath) {
  return fs.readFileSync(path.join(FRONTEND_SRC, relativePath), 'utf8');
}

describe('sessionInsightScreen guard', () => {
  it('hero y tarjetas de paso usan iconos vectoriales, no emojis', () => {
    const src = readSrc('screens/SessionInsightScreen.js');
    expect(src).toMatch(/resolveSessionInsightEmotionIcon/);
    expect(src).toMatch(/resolveSessionInsightStepVisual/);
    expect(src).toMatch(/resolveTccLiteResumeVisual/);
    expect(src).toMatch(/renderStepIconOrb/);
    expect(src).toMatch(/MaterialCommunityIcons/);
    expect(src).not.toMatch(/styles\.stepIcon[^O]/);
    expect(src).not.toMatch(/step\.icon/);
    expect(src).not.toMatch(/🧠/);
    expect(src).not.toMatch(/💡/);
    expect(src).not.toMatch(/emotion\?\.emoji/);
  });

  it('sessionInsightEmotionVisual delega pasos al catálogo de intervenciones', () => {
    const src = readSrc('utils/sessionInsightEmotionVisual.js');
    expect(src).toMatch(/resolveInterventionVisual/);
    expect(src).toMatch(/resolveSessionInsightStepVisual/);
    expect(src).toMatch(/head-lightbulb-outline/);
  });
});
