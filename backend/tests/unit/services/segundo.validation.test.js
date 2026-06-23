import emotionalAnalyzer from '../../../services/emotionalAnalyzer.js';
import { buildPreviousEmotionalPatterns } from '../../../utils/previousEmotionalPatterns.js';
import { assessSocialSupport } from '../../../constants/socialSupport.js';
import { detectFactualModeFromMessage } from '../../../services/chat/factualQueryDetector.js';
import { isEmotionalHurtNotSelfHarm } from '../../../constants/emotionalDistressSignals.js';

async function simulateTurn(userMessage, conversationHistory = []) {
  const patterns = buildPreviousEmotionalPatterns(conversationHistory);
  return emotionalAnalyzer.analyzeEmotion(userMessage, patterns);
}

function assistantMeta(analysis, topic = 'EMOCIONAL') {
  return {
    role: 'assistant',
    createdAt: new Date().toISOString(),
    metadata: {
      context: {
        emotional: { mainEmotion: analysis.mainEmotion, intensity: analysis.intensity },
        contextual: { tema: { categoria: topic } },
      },
    },
  };
}

describe('validación segundo.json (adolescente, anhedonia, imagen)', () => {
  it('turno 1: soledad como tristeza', async () => {
    const r = await simulateTurn('Me siento solo', []);
    expect(r.mainEmotion).toBe('tristeza');
    expect(r.intensity).toBeGreaterThanOrEqual(6);
  });

  it('turno 2: vapeo a los 15 tras soledad mantiene malestar', async () => {
    const history = [
      assistantMeta({ mainEmotion: 'tristeza', intensity: 7 }),
      { role: 'user', createdAt: new Date().toISOString(), content: 'Me siento solo' },
    ];
    const r = await simulateTurn(
      'Esqu e pasado muchas cosas y empecé a fumar vapor y tengo 15',
      history
    );
    expect(r.mainEmotion).toBe('tristeza');
    expect(r.intensity).toBeGreaterThanOrEqual(5);
  });

  it('turno 4: anhedonia no cae a neutral', async () => {
    const r = await simulateTurn('Esqu aora me an dejado de importan las cosas', []);
    expect(r.mainEmotion).toBe('tristeza');
    expect(r.intensity).toBeGreaterThanOrEqual(6);
  });

  it('turno 5: clarificación de valor propio (aún importa lo que vale)', async () => {
    const r = await simulateTurn('No me a dejado de importan q valen de mi y asi', []);
    expect(r.mainEmotion).toBe('tristeza');
    expect(r.intensity).toBeGreaterThanOrEqual(5);
  });

  it('turno 6: daño emocional por la cara, no autolesión', async () => {
    const msg = 'No pero lo q me ase daño es mi cara y cuando mencionan mi cara';
    expect(isEmotionalHurtNotSelfHarm(msg)).toBe(true);
    const r = await simulateTurn(msg, []);
    expect(r.mainEmotion).toBe('verguenza');
    expect(r.intensity).toBeGreaterThanOrEqual(6);
  });

  it('turno 7: carryover en "Que arruine mi cara"', async () => {
    const history = [
      assistantMeta({ mainEmotion: 'verguenza', intensity: 7 }),
      {
        role: 'user',
        createdAt: new Date().toISOString(),
        content: 'No pero lo q me ase daño es mi cara',
      },
      assistantMeta({ mainEmotion: 'tristeza', intensity: 8 }),
      {
        role: 'user',
        createdAt: new Date().toISOString(),
        content: 'Esqu tengo acné y eso me destruye',
      },
    ];
    const r = await simulateTurn('Que arruine mi cara', history);
    expect(['tristeza', 'verguenza']).toContain(r.mainEmotion);
    expect(r.intensity).toBeGreaterThanOrEqual(5);
  });

  it('no activa modo factual por "cuando mencionan mi cara"', () => {
    expect(
      detectFactualModeFromMessage({
        currentMessage: 'No pero lo q me ase daño es mi cara y cuando mencionan mi cara',
      })
    ).toBe(false);
  });

  it('no marca apoyo social alto al listar familia sin contexto positivo', () => {
    const r = assessSocialSupport('De todo bro amigos tíos y mi familia');
    expect(r.level).not.toBe('high');
  });
});
