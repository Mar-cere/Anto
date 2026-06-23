import {
  buildPreviousEmotionalPatterns,
} from '../../../utils/previousEmotionalPatterns.js';
import {
  detectSustainedThread,
  findCarryoverAnchor,
  getPeakNegativeIntensity,
  hasBriefFollowUpCue,
  normalizeHistoryPattern,
  resolveBriefFollowUpCarryover,
} from '../../../constants/briefFollowUpCarryover.js';
import emotionalAnalyzer from '../../../services/emotionalAnalyzer.js';

describe('briefFollowUpCarryover', () => {
  const emotionPatterns = {
    tristeza: { category: 'negative', intensity: 7 },
    miedo: { category: 'negative', intensity: 7 },
    neutral: { category: 'neutral', intensity: 4 },
  };

  it('normaliza emotion y mainEmotion', () => {
    expect(normalizeHistoryPattern({ emotion: 'tristeza', intensity: 6 })).toMatchObject({
      mainEmotion: 'tristeza',
      intensity: 6,
    });
  });

  it('detecta hilos de insomnio y relación', () => {
    const patterns = [
      {
        mainEmotion: 'tristeza',
        intensity: 6,
        topic: 'SALUD',
        content: 'No puedo dormir',
      },
    ];
    expect(detectSustainedThread(patterns, 'Es mi mente').sleep).toBe(true);
    expect(detectSustainedThread(patterns, 'Sobre mi ex relación').relationship).toBe(true);
  });

  it('detecta señales breves de seguimiento', () => {
    expect(hasBriefFollowUpCue('Es mi mente')).toBe(true);
    expect(hasBriefFollowUpCue('Sobre mi ex relación')).toBe(true);
    expect(hasBriefFollowUpCue('Hola')).toBe(false);
  });

  it('mantiene carryover moderado en insomnio + mensaje breve', () => {
    const patterns = [
      {
        mainEmotion: 'tristeza',
        intensity: 6,
        topic: 'SALUD',
        content: 'No puedo dormir',
      },
    ];

    const result = resolveBriefFollowUpCarryover(
      'es mi mente',
      { name: 'neutral', category: 'neutral' },
      4,
      patterns,
      { emotionPatterns, emotionNeutral: 'neutral' }
    );

    expect(result).not.toBeNull();
    expect(result.emotion.name).toBe('tristeza');
    expect(result.intensity).toBe(5);
  });

  it('mantiene carryover alto para medicación con pico 8+', () => {
    const patterns = [{ mainEmotion: 'miedo', intensity: 9, content: 'Tengo mucho miedo' }];
    const result = resolveBriefFollowUpCarryover(
      'las pastillas',
      { name: 'neutral', category: 'neutral' },
      4,
      patterns,
      { emotionPatterns, emotionNeutral: 'neutral' }
    );

    expect(result?.emotion.name).toBe('miedo');
    expect(result?.intensity).toBeGreaterThanOrEqual(7);
  });

    it('no arrastra emoción sin hilo ni señal en mensaje breve', () => {
    const patterns = [{ mainEmotion: 'tristeza', intensity: 6, topic: 'SALUD', content: 'No puedo dormir' }];
    const result = resolveBriefFollowUpCarryover(
      'ok',
      { name: 'neutral', category: 'neutral' },
      4,
      patterns,
      { emotionPatterns, emotionNeutral: 'neutral' }
    );
    expect(result).toBeNull();
  });

  it('no arrastra con deíctico "eso" en hilo moderado', () => {
    const patterns = [{ mainEmotion: 'tristeza', intensity: 6, topic: 'SALUD', content: 'No puedo dormir' }];
    const result = resolveBriefFollowUpCarryover(
      'eso',
      { name: 'neutral', category: 'neutral' },
      4,
      patterns,
      { emotionPatterns, emotionNeutral: 'neutral' }
    );
    expect(result).toBeNull();
  });

  it('usa el ancla emocional negativa más reciente', () => {
    const patterns = [
      { mainEmotion: 'tristeza', intensity: 6, topic: 'SALUD', content: 'No puedo dormir' },
      { mainEmotion: 'neutral', intensity: 4, topic: 'GENERAL', content: 'Es mi mente' },
    ];
    expect(findCarryoverAnchor(patterns)?.mainEmotion).toBe('tristeza');
    expect(getPeakNegativeIntensity(patterns)).toBe(6);
  });
});

describe('buildPreviousEmotionalPatterns', () => {
  it('toma los análisis más recientes en orden cronológico', () => {
    const history = [
      {
        role: 'assistant',
        createdAt: '2026-06-15T06:41:22.000Z',
        content: 'respuesta 2',
        metadata: { context: { emotional: { mainEmotion: 'neutral', intensity: 4 }, contextual: { tema: { categoria: 'GENERAL' } } } },
      },
      {
        role: 'user',
        createdAt: '2026-06-15T06:41:19.000Z',
        content: 'Es mi mente',
      },
      {
        role: 'assistant',
        createdAt: '2026-06-15T06:40:54.000Z',
        content: 'respuesta 1',
        metadata: { context: { emotional: { mainEmotion: 'tristeza', intensity: 6 }, contextual: { tema: { categoria: 'SALUD' } } } },
      },
      {
        role: 'user',
        createdAt: '2026-06-15T06:40:49.000Z',
        content: 'No puedo dormir',
      },
    ];

    const patterns = buildPreviousEmotionalPatterns(history, 2);
    expect(patterns).toHaveLength(2);
    expect(patterns[0].mainEmotion).toBe('tristeza');
    expect(patterns[0].content).toBe('No puedo dormir');
    expect(patterns[1].mainEmotion).toBe('neutral');
    expect(patterns[1].content).toBe('Es mi mente');
  });
});

describe('emotionalAnalyzer carryover insomnio/duelo', () => {
  it('simula primero.json: "Es mi mente" tras insomnio', async () => {
    const prev = [
      {
        mainEmotion: 'tristeza',
        intensity: 6,
        topic: 'SALUD',
        content: 'No puedo dormir',
      },
    ];
    const result = await emotionalAnalyzer.analyzeEmotion('Es mi mente', prev);
    expect(result.mainEmotion).toBe('tristeza');
    expect(result.intensity).toBeGreaterThanOrEqual(5);
    expect(result.category).toBe('negative');
  });

  it('acepta historial con campo emotion (legacy)', async () => {
    const prev = [{ emotion: 'tristeza', intensity: 6, topic: 'SALUD', content: 'No puedo dormir' }];
    const result = await emotionalAnalyzer.analyzeEmotion('Es mi mente', prev);
    expect(result.mainEmotion).toBe('tristeza');
  });
});
