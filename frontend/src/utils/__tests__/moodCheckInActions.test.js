import {
  isValidMoodCheckInKey,
  isValidMoodSecondaryAction,
  resolveMoodAcknowledgment,
  resolveMoodSecondaryAction,
  resolveMoodSuggestChat,
} from '../moodCheckInActions';

describe('moodCheckInActions', () => {
  it('valida claves de ánimo', () => {
    expect(isValidMoodCheckInKey('anxious')).toBe(true);
    expect(isValidMoodCheckInKey('hack')).toBe(false);
    expect(isValidMoodCheckInKey('')).toBe(false);
  });

  it('respeta suggestChat del servidor', () => {
    expect(resolveMoodSuggestChat({ mood: 'good', suggestChat: true })).toBe(true);
    expect(resolveMoodSuggestChat({ mood: 'anxious', suggestChat: false })).toBe(false);
  });

  it('infiere suggestChat para tenso/fatiga sin flag', () => {
    expect(resolveMoodSuggestChat({ mood: 'anxious' })).toBe(true);
    expect(resolveMoodSuggestChat({ mood: 'tired' })).toBe(true);
    expect(resolveMoodSuggestChat({ mood: 'calm' })).toBe(false);
    expect(resolveMoodSuggestChat({ mood: 'good' })).toBe(false);
    expect(resolveMoodSuggestChat(null)).toBe(false);
  });

  it('prioriza acknowledgment del servidor sobre fallback', () => {
    expect(
      resolveMoodAcknowledgment(
        { acknowledgment: 'Gracias por contarlo. No tienes que afrontarlo solo.' },
        'fallback',
      ),
    ).toBe('Gracias por contarlo. No tienes que afrontarlo solo.');
    expect(resolveMoodAcknowledgment({ acknowledgment: '  ' }, 'fallback')).toBe('fallback');
    expect(resolveMoodAcknowledgment(null, null)).toBe(null);
  });

  it('elige segunda acción contextual según ánimo y foco', () => {
    expect(resolveMoodSecondaryAction({ checkIn: { mood: 'anxious' } })?.kind).toBe('breathing');
    expect(resolveMoodSecondaryAction({ checkIn: { mood: 'tired' } })?.kind).toBe('grounding');
    expect(
      resolveMoodSecondaryAction({
        checkIn: { mood: 'tired' },
        focus: { baWeekNext: { isToday: true, slotId: 's1' } },
      })?.kind,
    ).toBe('ba_today');
    expect(
      resolveMoodSecondaryAction({
        checkIn: { mood: 'good' },
        focus: {
          lastSessionSummary: {
            conversationId: '507f1f77bcf86cd799439011',
            displaySubtitle: 'Has estado lidiando con el sueño',
          },
        },
      })?.kind,
    ).toBe('resume_chat');
    expect(
      resolveMoodSecondaryAction({
        checkIn: { mood: 'good' },
        focus: {
          lastSessionSummary: {
            conversationId: 'not-an-id',
            displaySubtitle: 'Snippet',
          },
        },
      }),
    ).toBeNull();
    expect(
      resolveMoodSecondaryAction({
        checkIn: { mood: 'calm' },
        focus: { nextHabit: { _id: 'h1', title: 'Caminar' } },
      })?.kind,
    ).toBe('next_habit');
  });

  it('valida payload de acción secundaria', () => {
    expect(isValidMoodSecondaryAction({ kind: 'breathing' })).toBe(true);
    expect(isValidMoodSecondaryAction({ kind: 'ba_today' })).toBe(false);
    expect(isValidMoodSecondaryAction({ kind: 'ba_today', slotId: 's1' })).toBe(true);
    expect(
      isValidMoodSecondaryAction({
        kind: 'resume_chat',
        conversationId: '507f1f77bcf86cd799439011',
      }),
    ).toBe(true);
    expect(isValidMoodSecondaryAction({ kind: 'resume_chat', conversationId: 'x' })).toBe(false);
  });
});
