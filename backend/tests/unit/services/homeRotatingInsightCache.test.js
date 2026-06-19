import {
  buildHomeInsightCacheKey,
  buildSummaryActivityFingerprint,
  parseHomeInsightCacheEntry,
  sanitizeHomeInsightForClient,
  serializeHomeInsightCacheEntry,
} from '../../../services/homeRotatingInsightCache.js';

describe('homeRotatingInsightCache', () => {
  it('sanitiza texto largo y ctaKey desconocida', () => {
    const long = 'a'.repeat(600);
    const out = sanitizeHomeInsightForClient({
      text: long,
      source: 'weekly',
      ctaKey: 'EVIL_KEY',
      destination: 'EvilScreen',
    });
    expect(out.text.length).toBe(500);
    expect(out.ctaKey).toBe('HOME_INSIGHT_CTA_PROGRESS');
    expect(out.destination).toBe('ActivitySummary');
  });

  it('rechaza textos demasiado cortos', () => {
    expect(sanitizeHomeInsightForClient({ text: 'corto' })).toBeNull();
  });

  it('invalida caché si cambia la huella de actividad', () => {
    const insight = {
      text: 'Notaste más calma los jueves después del chat.',
      source: 'weekly',
      ctaKey: 'HOME_INSIGHT_CTA_WEEKLY',
      destination: 'ActivitySummary',
    };
    const envelope = serializeHomeInsightCacheEntry(insight, 'fp-a');
    expect(parseHomeInsightCacheEntry(envelope, 'fp-a').hit).toBe(true);
    expect(parseHomeInsightCacheEntry(envelope, 'fp-b').hit).toBe(false);
  });

  it('genera huella distinta cuando cambia actividad del resumen', () => {
    const base = {
      period: { weekKey: '2026-W24' },
      chat: { userMessages: 2, distinctActiveDays: 1 },
      habits: { completionsInPeriod: 0 },
      tasks: { completedInPeriod: 0 },
      journal: { entriesCount: 0 },
    };
    const fp1 = buildSummaryActivityFingerprint(base);
    const fp2 = buildSummaryActivityFingerprint({
      ...base,
      chat: { userMessages: 5, distinctActiveDays: 2 },
    });
    expect(fp1).not.toBe(fp2);
  });

  it('no genera clave sin userId', () => {
    expect(buildHomeInsightCacheKey(null)).toBeNull();
  });
});
