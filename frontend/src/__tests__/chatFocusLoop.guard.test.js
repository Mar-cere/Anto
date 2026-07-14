/**
 * Blindaje anti-loop del chat: useFocusEffect no debe recrearse por callbacks
 * inestables (cancelaba el stream → typing colgado + rafaga de APIs).
 */
import fs from 'fs';
import path from 'path';

const FRONTEND_SRC = path.resolve(__dirname, '..');

function readSrc(relativePath) {
  return fs.readFileSync(path.join(FRONTEND_SRC, relativePath), 'utf8');
}

describe('chatFocusLoop guard', () => {
  it('useChatScreen estabiliza el foco del chat con refs y deps vacías', () => {
    const src = readSrc('hooks/useChatScreen.js');
    expect(src).toMatch(/initializeConversationRef/);
    expect(src).toMatch(/cancelActiveStreamRef/);
    expect(src).toMatch(/loadTccContinuityRef/);
    expect(src).toMatch(/userRef\.current/);
    expect(src).toMatch(/const userId = user\?\._id \?\? user\?\.id/);

    const marker = 'await initializeConversationRef.current()';
    const start = src.indexOf(marker);
    expect(start).toBeGreaterThan(-1);
    const focusBlock = src.slice(Math.max(0, start - 200), start + 1400);
    expect(focusBlock).toMatch(/loadTccContinuityRef\.current\(\)/);
    expect(focusBlock).toMatch(/cancelActiveStreamRef\.current\(\)/);
    expect(focusBlock).toMatch(/Solo foco\/blur real/);
    expect(focusBlock).toMatch(/,\s*\[\s*\]\s*\)/);
    expect(focusBlock).not.toMatch(/loadTccContinuity,/);
    expect(focusBlock).not.toMatch(/cancelActiveStream,/);
    expect(focusBlock).not.toMatch(/loadTrialInfo,/);
  });

  it('initializeConversation depende de userId estable, no del objeto user', () => {
    const src = readSrc('hooks/useChatScreen.js');
    expect(src).toMatch(/canAttemptChatAccess\(userRef\.current\)/);
    const depBlock = src.slice(
      src.indexOf('const initializeConversation = useCallback'),
      src.indexOf('const loadOlderMessages'),
    );
    expect(depBlock).toMatch(/userId,/);
    expect(depBlock).not.toMatch(/^\s*user,$/m);
  });

  it('AuthContext.applyLocalUser evita setUser si el snapshot no cambió', () => {
    const src = readSrc('context/AuthContext.js');
    expect(src).toMatch(/areUserSnapshotsEqual/);
    expect(src).toMatch(/setUser\(\(prev\) =>/);
  });

  it('DeviceTimezoneSync y DeviceRegionSync no dependen del objeto user completo', () => {
    const tz = readSrc('components/DeviceTimezoneSync.js');
    const region = readSrc('components/DeviceRegionSync.js');
    expect(tz).toMatch(/userTimezone/);
    expect(tz).not.toMatch(/\}, \[applyLocalUser, user, userId\]\)/);
    expect(region).toMatch(/userRegionCountry|currentRegion/);
    expect(region).not.toMatch(/\}, \[applyLocalUser, user, userId\]\)/);
  });

  it('getSubscriptionStatus deduplica en memoria para no bombardear /subscription-status', () => {
    const src = readSrc('services/paymentService.js');
    expect(src).toMatch(/SUBSCRIPTION_STATUS_CLIENT_CACHE_MS/);
    expect(src).toMatch(/subscriptionStatusInFlight/);
    expect(src).toMatch(/clearSubscriptionStatusClientCache/);
  });

  it('websocket connect reutiliza promesa in-flight del mismo usuario', () => {
    const src = readSrc('services/websocketService.js');
    expect(src).toMatch(/_connectInFlight/);
    expect(src).toMatch(/Reutilizar conexión en vuelo|mismo usuario/i);
  });

  it('si el repo ya incluye focus snippet, exige userId antes de llamar', () => {
    const builderPath = path.join(
      path.resolve(__dirname, '..', '..', '..'),
      'backend/services/openai/openaiPromptBuilder.js',
    );
    const src = fs.readFileSync(builderPath, 'utf8');
    if (!src.includes('buildFocusPromptSnippet')) return;
    expect(src).toMatch(/!contexto\.isGuest && mensaje\.userId/);
    expect(src).toMatch(/buildFocusPromptSnippet\(mensaje\.userId/);
  });
});
