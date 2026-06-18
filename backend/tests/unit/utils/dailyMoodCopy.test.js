import { describe, expect, it } from '@jest/globals';
import { DAILY_MOOD_VALUES } from '../../../models/DailyMoodCheckIn.js';
import {
  buildDailyMoodPromptSnippet,
  getDailyMoodCopy,
  toClientDailyMoodCheckIn,
} from '../../../utils/dailyMoodCopy.js';
import { hasSpanishVoseo } from '../../../utils/copyToneGuards.mjs';

describe('dailyMoodCopy', () => {
  it('expone copy para cada mood en es y en', () => {
    for (const mood of DAILY_MOOD_VALUES) {
      const es = getDailyMoodCopy(mood, 'es');
      const en = getDailyMoodCopy(mood, 'en');
      expect(es?.label).toBeTruthy();
      expect(en?.label).toBeTruthy();
      expect(es?.acknowledgment).toBeTruthy();
      expect(en?.acknowledgment).toBeTruthy();
      expect(typeof es?.suggestChat).toBe('boolean');
      expect(typeof en?.suggestChat).toBe('boolean');
    }
  });

  it('es: sin voseo en labels, acknowledgments ni snippets', () => {
    const hits = [];
    for (const mood of DAILY_MOOD_VALUES) {
      const meta = getDailyMoodCopy(mood, 'es');
      for (const field of ['label', 'acknowledgment', 'antoSnippet']) {
        if (hasSpanishVoseo(meta?.[field] || '')) {
          hits.push({ mood, field, value: meta[field] });
        }
      }
    }
    expect(hits).toEqual([]);
  });

  it('ansioso y cansado sugieren chat; tranquilo y bien no', () => {
    expect(getDailyMoodCopy('anxious', 'es').suggestChat).toBe(true);
    expect(getDailyMoodCopy('tired', 'es').suggestChat).toBe(true);
    expect(getDailyMoodCopy('calm', 'es').suggestChat).toBe(false);
    expect(getDailyMoodCopy('good', 'es').suggestChat).toBe(false);
  });

  it('toClientDailyMoodCheckIn localiza según idioma', () => {
    const doc = {
      mood: 'good',
      dateKey: '2026-06-17',
      source: 'dashboard',
      updatedAt: '2026-06-17T10:00:00.000Z',
    };
    const es = toClientDailyMoodCheckIn(doc, 'es');
    const en = toClientDailyMoodCheckIn(doc, 'en');
    expect(es.label).toBe('Bien');
    expect(en.label).toBe('Good');
    expect(es.acknowledgment).toMatch(/alegra/i);
    expect(en.acknowledgment).toMatch(/glad/i);
  });

  it('genera snippet de prompt en ambos idiomas', () => {
    const esSnippet = buildDailyMoodPromptSnippet({ mood: 'anxious' }, 'es');
    const enSnippet = buildDailyMoodPromptSnippet({ mood: 'anxious' }, 'en');
    expect(esSnippet).toMatch(/check-in del día/i);
    expect(esSnippet).toMatch(/ansioso/i);
    expect(enSnippet).toMatch(/morning check-in/i);
    expect(enSnippet).toMatch(/anxious/i);
  });
});
