/**
 * Guardas estructurales del check-in de ánimo del home.
 */
import fs from 'fs';
import path from 'path';

function readSrc(rel) {
  return fs.readFileSync(path.join(__dirname, '..', '..', rel), 'utf8');
}

describe('MoodCheckInCard guard', () => {
  it('usa acknowledgment del servidor y CTAs chat/secundarios', () => {
    const src = readSrc('components/dashboard/MoodCheckInCard.js');
    expect(src).toMatch(/resolveMoodAcknowledgment/);
    expect(src).toMatch(/resolveMoodSuggestChat/);
    expect(src).toMatch(/resolveMoodSecondaryAction/);
    expect(src).toMatch(/onOpenChat/);
    expect(src).toMatch(/onSecondaryAction/);
    expect(src).toMatch(/fromMoodCheckIn/);
    expect(src).toMatch(/MOOD_OPEN_CHAT_CTA/);
  });

  it('DashScreen cablea chat contextual y acciones secundarias', () => {
    const src = readSrc('screens/DashScreen.js');
    expect(src).toMatch(/handleMoodSecondaryAction/);
    expect(src).toMatch(/moodCheckInMood/);
    expect(src).toMatch(/isValidMoodSecondaryAction/);
    expect(src).toMatch(/isValidMoodCheckInKey/);
    expect(src).toMatch(/onSecondaryAction=\{handleMoodSecondaryAction\}/);
    expect(src).toMatch(/MoodCheckInCard[\s\S]*onOpenChat=\{goToChatFromOnboarding\}/);
  });

  it('useChatScreen valida mood del puente y espera init', () => {
    const src = readSrc('hooks/useChatScreen.js');
    expect(src).toMatch(/isValidMoodCheckInKey/);
    expect(src).toMatch(/pickMoodBridgeWelcomeGreeting/);
    expect(src).toMatch(/if \(isLoading\) return/);
    expect(src).toMatch(/prev\.length === 0/);
  });
});
