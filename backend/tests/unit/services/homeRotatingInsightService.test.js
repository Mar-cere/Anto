import {
  buildHomeInsightCandidates,
  homeInsightRotationSeed,
  pickHomeRotatingInsight,
  pickStableVariantIndex,
} from '../../../services/homeRotatingInsightService.js';
import {
  buildHomeInsightCacheKey,
  parseHomeInsightCacheEntry,
  serializeHomeInsightCacheEntry,
} from '../../../services/homeRotatingInsightCache.js';
import cacheService from '../../../services/cacheService.js';
import { getPreviousIsoWeekKey } from '../../../utils/weekKeys.js';

describe('homeRotatingInsightService', () => {
  it('arma candidatos desde patrones, resumen y mapa', () => {
    const candidates = buildHomeInsightCandidates({
      weeklyInsight: {
        status: 'ready',
        headline: 'Más calma los jueves',
        insights: [{ detail: 'Notaste más calma los jueves después del chat.' }],
      },
      summary: {
        narrative: {
          microWins: 'Completaste 0 tareas y registraste 1 avance en hábitos.',
          themes: 'Temas recurrentes alrededor del trabajo.',
        },
      },
      graphCorrelations: [
        {
          type: 'topic_intervention',
          sourceId: 'ansiedad',
          interventionLabel: 'Respiración',
        },
      ],
      language: 'es',
    });

    expect(candidates.length).toBeGreaterThanOrEqual(2);
    expect(candidates.some((c) => c.source === 'weekly')).toBe(true);
    expect(candidates.some((c) => c.source === 'summary')).toBe(true);
    expect(candidates.some((c) => c.source === 'graph')).toBe(true);
    expect(candidates.some((c) => c.text.includes('0 tareas'))).toBe(false);
  });

  it('rota de forma estable con la misma semilla', () => {
    const candidates = [
      { id: 'a', text: 'Insight A', source: 'weekly', ctaKey: 'HOME_INSIGHT_CTA_WEEKLY' },
      { id: 'b', text: 'Insight B', source: 'summary', ctaKey: 'HOME_INSIGHT_CTA_SUMMARY' },
    ];
    const seed = homeInsightRotationSeed('2026-06-19');
    expect(pickHomeRotatingInsight(candidates, seed)).toEqual(
      pickHomeRotatingInsight(candidates, seed),
    );
    expect(pickStableVariantIndex(seed, 2)).toBeGreaterThanOrEqual(0);
  });

  it('serializa y parsea entradas de caché', () => {
    const insight = {
      text: 'Notaste más calma los jueves.',
      source: 'weekly',
      ctaKey: 'HOME_INSIGHT_CTA_WEEKLY',
      destination: 'ActivitySummary',
    };
    const serialized = serializeHomeInsightCacheEntry(insight, 'fp');
    expect(parseHomeInsightCacheEntry(serialized, 'fp')).toEqual({ hit: true, insight });

    const empty = serializeHomeInsightCacheEntry(null, 'fp');
    expect(parseHomeInsightCacheEntry(empty, 'fp')).toEqual({ hit: true, insight: null });
    expect(parseHomeInsightCacheEntry({ v: 0 }, 'fp')).toEqual({ hit: false, insight: null });
  });

  it('genera clave estable por usuario, día, idioma y semana', () => {
    const keyA = buildHomeInsightCacheKey('user1', {
      language: 'es',
      dayKey: '2026-06-19',
      weekKey: '2026-W24',
    });
    const keyB = buildHomeInsightCacheKey('user1', {
      language: 'es',
      dayKey: '2026-06-19',
      weekKey: '2026-W24',
    });
    const keyC = buildHomeInsightCacheKey('user1', {
      language: 'en',
      dayKey: '2026-06-19',
      weekKey: '2026-W24',
    });
    expect(keyA).toBe(keyB);
    expect(keyA).not.toBe(keyC);
  });

  it('buildHomeRotatingInsightForUser usa caché en segundo llamado', async () => {
    if (cacheService.memoryCache) {
      cacheService.memoryCache.clear();
    }
    const userId = 'cache-test-user';
    const dayKey = new Date().toISOString().slice(0, 10);
    const weekKey = getPreviousIsoWeekKey();
    const cacheKey = buildHomeInsightCacheKey(userId, { language: 'es', dayKey, weekKey });
    const cachedInsight = {
      text: 'Insight desde caché con suficiente longitud.',
      source: 'summary',
      ctaKey: 'HOME_INSIGHT_CTA_SUMMARY',
      destination: 'ActivitySummary',
      rotationSeed: homeInsightRotationSeed(dayKey),
    };
    await cacheService.set(
      cacheKey,
      serializeHomeInsightCacheEntry(cachedInsight, 'na'),
      3600,
    );

    const { buildHomeRotatingInsightForUser } = await import(
      '../../../services/homeRotatingInsightService.js'
    );
    const result = await buildHomeRotatingInsightForUser(userId, {
      language: 'es',
      summary: null,
    });
    expect(result).toEqual(cachedInsight);
  });

  it('devuelve null sin userId', async () => {
    const { buildHomeRotatingInsightForUser } = await import(
      '../../../services/homeRotatingInsightService.js'
    );
    await expect(buildHomeRotatingInsightForUser(null)).resolves.toBeNull();
  });

  it('devuelve bienvenida sin señal de actividad', async () => {
    const { buildHomeRotatingInsightForUser } = await import(
      '../../../services/homeRotatingInsightService.js'
    );
    const result = await buildHomeRotatingInsightForUser('welcome-user', {
      language: 'es',
      summary: {
        chat: { userMessages: 0, distinctActiveDays: 0 },
        habits: { completionsInPeriod: 0, bestCurrentStreakAmongActive: 0 },
        tasks: { completedInPeriod: 0 },
        journal: { entriesCount: 0 },
        techniques: { totalUses: 0 },
      },
    });
    expect(result?.variant).toBe('welcome');
    expect(result?.source).toBe('welcome');
    expect(result?.ctaKey).toBe('HOME_INSIGHT_CTA_CHAT');
    expect(result?.destination).toBe('Chat');
    expect(result?.text).toMatch(/bienestar|descargado|salud mental/i);
  });
});
