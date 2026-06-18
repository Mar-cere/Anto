import { focusCopy } from '../../../utils/focusDashboardCopy.js';
import { getMailerStrings } from '../../../constants/emailMailerStrings.js';
import { hasSpanishVoseo } from '../../../utils/copyToneGuards.mjs';
import { getDailyMoodCopy } from '../../../utils/dailyMoodCopy.js';
import { dailyMoodApiCopy } from '../../../utils/dailyMoodApiCopy.js';
import { DAILY_MOOD_VALUES } from '../../../models/DailyMoodCheckIn.js';

describe('copyToneGuards', () => {
  it('focusDashboardCopy es sin voseo', () => {
    const c = focusCopy('es');
    const values = Object.values(c).filter((v) => typeof v === 'string');
    const hits = values.filter(hasSpanishVoseo);
    expect(hits).toEqual([]);
  });

  it('emailMailerStrings es sin voseo en cadenas planas', () => {
    const strings = getMailerStrings('es');
    const flat = JSON.stringify(strings);
    expect(hasSpanishVoseo(flat)).toBe(false);
  });

  it('dailyMoodApiCopy es sin voseo', () => {
    const copy = dailyMoodApiCopy('es');
    const hits = Object.values(copy).filter(
      (value) => typeof value === 'string' && hasSpanishVoseo(value),
    );
    expect(hits).toEqual([]);
  });

  it('dailyMoodCopy es sin voseo en campos visibles', () => {
    const hits = [];
    for (const mood of DAILY_MOOD_VALUES) {
      const meta = getDailyMoodCopy(mood, 'es');
      for (const value of [meta?.label, meta?.acknowledgment, meta?.antoSnippet]) {
        if (typeof value === 'string' && hasSpanishVoseo(value)) hits.push(value);
      }
    }
    expect(hits).toEqual([]);
  });
});
