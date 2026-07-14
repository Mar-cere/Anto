import { describe, expect, it } from '@jest/globals';
import { DAILY_MOOD_VALUES } from '../../../models/DailyMoodCheckIn.js';
import {
  buildDailyMoodPromptSnippet,
  buildMoodBridgeWelcome,
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
      (meta?.acknowledgments || []).forEach((value, index) => {
        if (hasSpanishVoseo(value || '')) {
          hits.push({ mood, field: `acknowledgments[${index}]`, value });
        }
      });
    }
    expect(hits).toEqual([]);
  });

  it('rota acknowledgment según dateKey', () => {
    const a = getDailyMoodCopy('anxious', 'es', '2026-07-14');
    const b = getDailyMoodCopy('anxious', 'es', '2026-07-15');
    expect(a.acknowledgment).toBeTruthy();
    expect(b.acknowledgment).toBeTruthy();
    expect(a.acknowledgments.length).toBeGreaterThan(1);
    // mismos inputs → mismo texto
    expect(getDailyMoodCopy('anxious', 'es', '2026-07-14').acknowledgment).toBe(a.acknowledgment);
  });

  it('tenso y fatiga sugieren chat; calma y bien no', () => {
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
    expect(esSnippet).toMatch(/NO preguntes cómo se siente/i);
    expect(esSnippet).toMatch(/tenso/i);
    expect(enSnippet).toMatch(/Do NOT ask how they feel again/i);
    expect(enSnippet).toMatch(/tense/i);
  });

  describe('buildMoodBridgeWelcome', () => {
    it('genera welcome puente para cada mood en es y en, sin repreguntar el ánimo', () => {
      for (const mood of DAILY_MOOD_VALUES) {
        const es = buildMoodBridgeWelcome({ mood, dateKey: '2026-07-14' }, 'es');
        const en = buildMoodBridgeWelcome({ mood, dateKey: '2026-07-14' }, 'en');
        expect(es).toBeTruthy();
        expect(en).toBeTruthy();
        expect(es).not.toMatch(/¿Cómo te sientes/i);
        expect(en).not.toMatch(/How are you feeling/i);
        expect(hasSpanishVoseo(es)).toBe(false);
      }
    });

    it('rota estable por dateKey', () => {
      const a = buildMoodBridgeWelcome({ mood: 'anxious', dateKey: '2026-07-14' }, 'es');
      expect(buildMoodBridgeWelcome({ mood: 'anxious', dateKey: '2026-07-14' }, 'es')).toBe(a);
    });

    it('devuelve null sin check-in o con mood inválido', () => {
      expect(buildMoodBridgeWelcome(null, 'es')).toBeNull();
      expect(buildMoodBridgeWelcome({ mood: 'sad' }, 'es')).toBeNull();
      expect(buildMoodBridgeWelcome({ mood: '' }, 'en')).toBeNull();
    });
  });
});
