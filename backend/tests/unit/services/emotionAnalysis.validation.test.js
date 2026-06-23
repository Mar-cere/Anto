import { detectImplicitNeeds } from '../../../constants/implicitNeeds.js';
import emotionalAnalyzer from '../../../services/emotionalAnalyzer.js';
import { buildPreviousEmotionalPatterns } from '../../../utils/previousEmotionalPatterns.js';

/**
 * Simula turnos de primero.json (insomnio → ex → desamor → rechazo).
 */
async function simulateTurn(userMessage, conversationHistory = []) {
  const patterns = buildPreviousEmotionalPatterns(conversationHistory);
  return emotionalAnalyzer.analyzeEmotion(userMessage, patterns);
}

function assistantMetadataFromAnalysis(analysis, topic = 'GENERAL') {
  return {
    role: 'assistant',
    createdAt: new Date().toISOString(),
    metadata: {
      context: {
        emotional: {
          mainEmotion: analysis.mainEmotion,
          intensity: analysis.intensity,
        },
        contextual: {
          tema: { categoria: topic },
        },
      },
    },
  };
}

describe('validación primero.json (insomnio y duelo)', () => {
  it('turno 1: no confunde insomnio con necesidad de competencia', async () => {
    const analysis = await simulateTurn('No puedo dormir', []);
    expect(analysis.mainEmotion).not.toBe('esperanza');
    expect(['tristeza', 'ansiedad', 'neutral']).toContain(analysis.mainEmotion);
    expect(detectImplicitNeeds('No puedo dormir').map((n) => n.type)).not.toContain('competence');
  });

  it('turno 2: mantiene hilo tras "Es mi mente"', async () => {
    const history = [
      assistantMetadataFromAnalysis(
        { mainEmotion: 'tristeza', intensity: 6 },
        'SALUD'
      ),
      { role: 'user', createdAt: new Date().toISOString(), content: 'No puedo dormir' },
    ];
    const analysis = await simulateTurn('Es mi mente', history);
    expect(analysis.mainEmotion).toBe('tristeza');
    expect(analysis.category).toBe('negative');
    expect(analysis.intensity).toBeGreaterThanOrEqual(5);
  });

  it('turno 3: reconoce tema relacional sin colapsar a neutral', async () => {
    const history = [
      assistantMetadataFromAnalysis({ mainEmotion: 'neutral', intensity: 4 }, 'GENERAL'),
      { role: 'user', createdAt: new Date().toISOString(), content: 'Es mi mente' },
      assistantMetadataFromAnalysis({ mainEmotion: 'tristeza', intensity: 6 }, 'SALUD'),
      { role: 'user', createdAt: new Date().toISOString(), content: 'No puedo dormir' },
    ];
    const analysis = await simulateTurn('Sobre mi ex relación', history);
    expect(analysis.mainEmotion).toBe('tristeza');
    expect(analysis.intensity).toBeGreaterThanOrEqual(5);
  });

  it('turno 4: detecta desamoramiento (incluye typo desanamorame)', async () => {
    const analysis = await simulateTurn('Si . Estoy en el proceso de desanamorame', []);
    expect(analysis.mainEmotion).toBe('tristeza');
    expect(analysis.category).toBe('negative');
  });

  it('turno 5: niega esperanza sin clasificarla como positiva', async () => {
    const message =
      'Esperanza ya no porque hice todo lo posible para demostrarle que yo si lo quería en mi vida pero él no';
    const analysis = await simulateTurn(message, []);
    expect(analysis.mainEmotion).toBe('tristeza');
    expect(analysis.category).toBe('negative');
    expect(analysis.mainEmotion).not.toBe('esperanza');
    expect(analysis.intensity).toBeGreaterThanOrEqual(6);
  });
});

describe('validación blindaje negación y carryover', () => {
  it('no usa "no me preocupa X" como negación de ansiedad', () => {
    const analysis = emotionalAnalyzer.detectPrimaryEmotion('no me preocupa lo que digan');
    expect(analysis.name).not.toBe('ansiedad');
  });

  it('no arrastra con deíctico "eso" en hilo moderado', async () => {
    const prev = [{ mainEmotion: 'tristeza', intensity: 6, topic: 'SALUD', content: 'No puedo dormir' }];
    const analysis = await emotionalAnalyzer.analyzeEmotion('eso', prev);
    expect(analysis.mainEmotion).toBe('neutral');
  });

  it('sí arrastra con deíctico "eso" en pico alto', async () => {
    const prev = [{ mainEmotion: 'miedo', intensity: 9, content: 'Tengo mucho miedo' }];
    const analysis = await emotionalAnalyzer.analyzeEmotion('eso', prev);
    expect(analysis.mainEmotion).toBe('miedo');
  });

  it('no pisa emoción explícita fuerte en mensaje breve', async () => {
    const prev = [{ mainEmotion: 'tristeza', intensity: 6, topic: 'SALUD', content: 'No puedo dormir' }];
    const analysis = await emotionalAnalyzer.analyzeEmotion('Estoy furioso', prev);
    expect(analysis.mainEmotion).toBe('enojo');
  });

  it('empareja el turno de usuario correcto en historial denso', () => {
    const history = [
      {
        role: 'assistant',
        createdAt: '2026-06-15T06:43:22.000Z',
        metadata: { context: { emotional: { mainEmotion: 'neutral', intensity: 4 } } },
      },
      { role: 'user', createdAt: '2026-06-15T06:43:19.000Z', content: 'Si . Estoy en el proceso de desanamorame' },
      {
        role: 'assistant',
        createdAt: '2026-06-15T06:41:48.000Z',
        metadata: { context: { emotional: { mainEmotion: 'neutral', intensity: 4 } } },
      },
      { role: 'user', createdAt: '2026-06-15T06:41:45.000Z', content: 'Sobre mi ex relación' },
      {
        role: 'assistant',
        createdAt: '2026-06-15T06:41:22.000Z',
        metadata: { context: { emotional: { mainEmotion: 'neutral', intensity: 4 } } },
      },
      { role: 'user', createdAt: '2026-06-15T06:41:19.000Z', content: 'Es mi mente' },
    ];

    const patterns = buildPreviousEmotionalPatterns(history, 2);
    expect(patterns[1].content).toBe('Si . Estoy en el proceso de desanamorame');
    expect(patterns[0].content).toBe('Sobre mi ex relación');
  });
});
