import {
  formatCalendarDateKeyInTz,
  upsertTodayDailyMoodCheckIn,
  getTodayDailyMoodCheckIn,
} from '../../../services/dailyMoodCheckInService.js';
import {
  buildDailyMoodPromptSnippet,
  getDailyMoodCopy,
} from '../../../utils/dailyMoodCopy.js';

describe('dailyMoodCheckInService', () => {
  it('formatea dateKey YYYY-MM-DD', () => {
    const key = formatCalendarDateKeyInTz(new Date('2026-06-17T15:00:00.000Z'), 'UTC');
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('rechaza mood inválido', async () => {
    const result = await upsertTodayDailyMoodCheckIn('000000000000000000000001', 'invalid');
    expect(result.error).toBe('invalidMood');
  });
});

describe('dailyMoodCopy', () => {
  it('marca ansioso como suggestChat', () => {
    const meta = getDailyMoodCopy('anxious', 'es');
    expect(meta.suggestChat).toBe(true);
    expect(meta.label).toBe('Tenso');
  });

  it('genera snippet de prompt en español', () => {
    const snippet = buildDailyMoodPromptSnippet({ mood: 'tired' }, 'es');
    expect(snippet).toMatch(/check-in del día/i);
    expect(snippet).toMatch(/fatiga/i);
  });
});
