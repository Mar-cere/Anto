import { isValidSessionIntentionId, SESSION_INTENTION_VALUES } from '../sessionIntention';

describe('sessionIntention (frontend)', () => {
  it('SESSION_INTENTION_VALUES coincide con API', () => {
    expect(SESSION_INTENTION_VALUES).toEqual(['vent', 'organize', 'technique', 'plan']);
  });

  it('isValidSessionIntentionId', () => {
    expect(isValidSessionIntentionId('vent')).toBe(true);
    expect(isValidSessionIntentionId('  plan  ')).toBe(true);
    expect(isValidSessionIntentionId('')).toBe(false);
    expect(isValidSessionIntentionId('hack')).toBe(false);
    expect(isValidSessionIntentionId(null)).toBe(false);
  });
});
