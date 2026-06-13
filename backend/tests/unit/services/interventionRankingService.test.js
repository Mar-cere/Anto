import {
  buildRankingScoreMap,
  buildTopicFreeAffinityBoost,
  buildTopicFreeLexicalBoost,
  buildTopicFreeSemanticBoost,
  mergeRankingScoreMaps,
  rankInterventionIds,
  scoreInterventionEdge,
} from '../../../services/interventionRankingService.js';

describe('interventionRankingService', () => {
  it('prioriza intervenciones con mejor completionRate', () => {
    const high = scoreInterventionEdge({
      shown: 4,
      clicked: 3,
      completed: 3,
      dismissed: 0,
    });
    const low = scoreInterventionEdge({
      shown: 4,
      clicked: 1,
      completed: 0,
      dismissed: 3,
    });
    expect(high).toBeGreaterThan(low);
  });

  it('rankInterventionIds mantiene orden estable en empate', () => {
    const ids = ['a', 'b', 'c'];
    const ranked = rankInterventionIds(ids, new Map());
    expect(ranked).toEqual(['a', 'b', 'c']);
  });

  it('rankInterventionIds sube ids con mejor score', () => {
    const ranked = rankInterventionIds(
      ['breathing_exercise', 'grounding_technique', 'psychoeducation_anxiety'],
      new Map([
        ['psychoeducation_anxiety', 2.5],
        ['grounding_technique', 0.1],
        ['breathing_exercise', 0.2],
      ]),
    );
    expect(ranked[0]).toBe('psychoeducation_anxiety');
  });

  it('buildRankingScoreMap pondera el topicTag actual', () => {
    const map = buildRankingScoreMap(
      [
        {
          _id: { topicTag: 'general', interventionId: 'breathing_exercise' },
          shown: 2,
          clicked: 2,
          completed: 2,
          dismissed: 0,
        },
        {
          _id: { topicTag: 'trabajo', interventionId: 'task_break' },
          shown: 2,
          clicked: 2,
          completed: 2,
          dismissed: 0,
        },
      ],
      'trabajo',
    );
    expect(map.get('task_break')).toBeGreaterThan(map.get('breathing_exercise'));
  });

  it('buildTopicFreeSemanticBoost ignora vectores de distinta dimensión', () => {
    const boost = buildTopicFreeSemanticBoost(
      [
        {
          interventionId: 'behavioral_activation',
          topicFreeEmbedding: [1, 0],
          eventType: 'completed',
        },
      ],
      [1, 0, 0],
      { minSimilarity: 0.1 },
    );
    expect(boost.size).toBe(0);
  });

  it('buildTopicFreeSemanticBoost prioriza vectores cercanos', () => {
    const query = [1, 0, 0];
    const boost = buildTopicFreeSemanticBoost(
      [
        {
          interventionId: 'behavioral_activation',
          topicFreeEmbedding: [0.99, 0.1, 0],
          eventType: 'completed',
        },
        {
          interventionId: 'self_care',
          topicFreeEmbedding: [0, 1, 0],
          eventType: 'clicked',
        },
      ],
      query,
      { minSimilarity: 0.5 },
    );
    expect(boost.get('behavioral_activation') ?? 0).toBeGreaterThan(boost.get('self_care') ?? 0);
  });

  it('buildTopicFreeAffinityBoost híbrido toma máximo léxico/semántico', () => {
    const query = [1, 0, 0];
    const boost = buildTopicFreeAffinityBoost(
      [
        {
          interventionId: 'behavioral_activation',
          topicFree: 'No tengo ganas de nada y me cuesta levantarme cada mañana',
          topicFreeEmbedding: [0.99, 0.1, 0],
          eventType: 'completed',
        },
      ],
      'No tengo ganas de levantarme y siento que nada tiene sentido',
      { queryEmbedding: query, minSimilarity: 0.5 },
    );
    const lexicalOnly = buildTopicFreeLexicalBoost(
      [
        {
          interventionId: 'behavioral_activation',
          topicFree: 'No tengo ganas de nada y me cuesta levantarme cada mañana',
          eventType: 'completed',
        },
      ],
      'No tengo ganas de levantarme y siento que nada tiene sentido',
    );
    expect(boost.get('behavioral_activation') ?? 0).toBeGreaterThanOrEqual(
      lexicalOnly.get('behavioral_activation') ?? 0,
    );
  });

  it('buildTopicFreeLexicalBoost prioriza intervenciones con mensaje similar', () => {
    const boost = buildTopicFreeLexicalBoost(
      [
        {
          interventionId: 'behavioral_activation',
          topicFree: 'No tengo ganas de nada y me cuesta levantarme cada mañana',
          eventType: 'completed',
        },
        {
          interventionId: 'self_care',
          topicFree: 'Me duele mucho la cabeza desde ayer por la tarde',
          eventType: 'clicked',
        },
      ],
      'No tengo ganas de levantarme y siento que nada tiene sentido',
    );
    expect(boost.get('behavioral_activation') ?? 0).toBeGreaterThan(boost.get('self_care') ?? 0);
  });

  it('mergeRankingScoreMaps combina grafo y topicFree', () => {
    const merged = mergeRankingScoreMaps(
      new Map([['behavioral_activation', 1]]),
      new Map([['behavioral_activation', 2], ['grounding_technique', 1]]),
    );
    expect(merged.get('behavioral_activation')).toBeGreaterThan(1);
    expect(merged.get('grounding_technique')).toBeGreaterThan(0);
  });
});

describe('actionSuggestionService ranking integration', () => {
  it('reordena candidatos cuando hay rankingScores', async () => {
    const { default: actionSuggestionService } = await import(
      '../../../services/actionSuggestionService.js'
    );
    const base = actionSuggestionService.generateSuggestions({
      mainEmotion: 'ansiedad',
      intensity: 8,
      topic: 'general',
    });
    const ranked = actionSuggestionService.generateSuggestions(
      { mainEmotion: 'ansiedad', intensity: 8, topic: 'general' },
      {},
      {
        rankingScores: new Map([[base[0], -1], [base[base.length - 1], 5]]),
      },
    );
    expect(ranked[ranked.length - 1]).toBe(base[0]);
  });
});
