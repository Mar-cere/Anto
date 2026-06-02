import {
  buildRankingScoreMap,
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
