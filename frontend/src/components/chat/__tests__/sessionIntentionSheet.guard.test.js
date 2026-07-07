/**
 * Guard — sheet de intención de sesión unificado (#72).
 */
import fs from 'fs';
import path from 'path';

const FRONTEND_SRC = path.resolve(__dirname, '..', '..', '..');

function readSrc(relativePath) {
  return fs.readFileSync(path.join(FRONTEND_SRC, relativePath), 'utf8');
}

describe('sessionIntentionSheet guard', () => {
  it('ChatScreen usa sheet centrado y oculta empty state duplicado', () => {
    const chat = readSrc('screens/ChatScreen.js');
    expect(chat).toMatch(/SessionIntentionSheet/);
    expect(chat).not.toMatch(/SessionIntentionBanner/);
    expect(chat).toMatch(/showSessionIntentionSheet/);
    expect(chat).toMatch(/showSessionIntentionPrompt && guestQuota === null && !isLoading/);
    expect(chat).toMatch(/if \(showSessionIntentionSheet\) return null/);
  });

  it('SessionIntentionSheet usa modal opaco y lista vertical con iconos', () => {
    const sheet = readSrc('components/chat/SessionIntentionSheet.js');
    expect(sheet).toMatch(/Modal/);
    expect(sheet).toMatch(/modalSurface/);
    expect(sheet).toMatch(/backdropStrong/);
    expect(sheet).toMatch(/MaterialCommunityIcons/);
    expect(sheet).toMatch(/SESSION_INTENTION_SUBTITLE/);
    expect(sheet).toMatch(/isValidSessionIntentionId/);
    expect(sheet).not.toMatch(/textDecorationLine:\s*'underline'/);
    expect(sheet).not.toMatch(/width:\s*'48%'/);
  });

  it('no queda referencia al banner legacy en src', () => {
    const chat = readSrc('screens/ChatScreen.js');
    expect(fs.existsSync(path.join(FRONTEND_SRC, 'components/chat/SessionIntentionBanner.js'))).toBe(
      false,
    );
    expect(chat).not.toMatch(/SessionIntentionBanner/);
  });
});
