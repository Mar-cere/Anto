/**
 * Modo inmersivo: oculta distracciones, no franjas de crisis.
 */
import fs from 'fs';
import path from 'path';

const FRONTEND_SRC = path.resolve(__dirname, '..');

function readSrc(relativePath) {
  return fs.readFileSync(path.join(FRONTEND_SRC, relativePath), 'utf8');
}

describe('chatImmersiveMode guard', () => {
  it('ChatScreen oculta trial/partículas/TCC en inmersivo, no crisis', () => {
    const src = readSrc('screens/ChatScreen.js');

    expect(src).toMatch(/immersiveMode \? null : <ParticleBackground/);
    expect(src).toMatch(/!trialBannerDismissed && !immersiveMode/);
    expect(src).toMatch(/\{!immersiveMode \? \(\s*<TccLiteAtHandoffStrip/);
    expect(src).toMatch(/\{!immersiveMode \? \(\s*<TccContinuityStrip/);

    expect(src).toMatch(
      /showSoftCrisisStrip\s*=\s*\n?\s*Boolean\(softCrisisCheckInPanel\) && !crisisResourcesPanel/,
    );
    expect(src).toMatch(/showCrisisStrip = Boolean\(crisisResourcesPanel\)/);
    expect(src).not.toMatch(/showCrisisStrip = !immersiveMode &&/);
    expect(src).not.toMatch(
      /showSoftCrisisStrip\s*=\s*\n?\s*!immersiveMode && Boolean\(softCrisisCheckInPanel\)/,
    );
  });

  it('useChatScreen persiste el modo inmersivo en AsyncStorage', () => {
    const src = readSrc('hooks/useChatScreen.js');
    expect(src).toMatch(/STORAGE_KEYS\.CHAT_IMMERSIVE_MODE/);
    expect(src).toMatch(/toggleImmersiveMode/);
    expect(src).toMatch(/AsyncStorage\.setItem\(STORAGE_KEYS\.CHAT_IMMERSIVE_MODE/);
  });
});
