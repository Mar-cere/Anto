/**
 * Smoke #127 fase 2: valida bucle lógico shown → ranking sin MongoDB.
 * Uso: node scripts/smoke-intervention-graph-loop.mjs
 */
import actionSuggestionService from '../services/actionSuggestionService.js';
import { planChatActionSuggestions } from '../services/psychoeducationPromptSnippetService.js';
import {
  buildRankingScoreMap,
  buildTopicFreeLexicalBoost,
  scoreInterventionEdge,
} from '../services/interventionRankingService.js';
import { buildTopicFreeFromContinuityItem, buildTopicFreeFromUserContent } from '../utils/interventionTopicFree.js';
import { CHAT_BA_SMOKE_CASES } from '../tests/fixtures/chatBaSmokeMessages.js';

const USER_MSG =
  'No tengo ganas de nada y me cuesta levantarme. Siento que nada tiene sentido en el trabajo.';

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exitCode = 1;
    throw new Error(msg);
  }
  console.log('OK:', msg);
}

async function main() {
  const topicFree = buildTopicFreeFromUserContent(USER_MSG);
  assert(topicFree === USER_MSG, 'topicFree captura el mensaje del usuario');

  const analysis = {
    mainEmotion: 'tristeza',
    intensity: 7,
    topic: 'trabajo',
  };

  const plan = await planChatActionSuggestions({
    emotionalAnalysis: analysis,
    contextualAnalysis: { tema: 'trabajo' },
    userContent: USER_MSG,
    userId: null,
    conversationId: null,
    conversationHistory: [{ role: 'user', content: USER_MSG }],
    language: 'es',
  });

  assert(plan.shouldShow === true, 'planChatActionSuggestions muestra sugerencias para BA');
  assert(
    plan.actionIds.includes('behavioral_activation'),
    'incluye behavioral_activation en candidatos',
  );
  assert(plan.formatted.length >= 1, 'formatted tiene al menos una tarjeta');

  const lowEdge = {
    shown: 3,
    clicked: 1,
    dismissed: 2,
    completed: 0,
  };
  const highEdge = {
    shown: 3,
    clicked: 2,
    dismissed: 0,
    completed: 2,
  };
  assert(
    scoreInterventionEdge(highEdge) > scoreInterventionEdge(lowEdge),
    'ranking premia mayor completionRate',
  );

  const edges = [
    {
      _id: { topicTag: 'trabajo', interventionId: 'behavioral_activation' },
      ...highEdge,
    },
    {
      _id: { topicTag: 'trabajo', interventionId: 'self_care' },
      ...lowEdge,
    },
  ];
  const scores = buildRankingScoreMap(edges, 'trabajo');
  assert(
    (scores.get('behavioral_activation') ?? -1) > (scores.get('self_care') ?? -1),
    'buildRankingScoreMap prioriza BA completada sobre self_care descartada',
  );

  const affinity = buildTopicFreeLexicalBoost(
    [
      {
        interventionId: 'behavioral_activation',
        topicFree: USER_MSG,
        eventType: 'completed',
      },
      {
        interventionId: 'self_care',
        topicFree: 'Me duele la cabeza desde ayer por la tarde',
        eventType: 'clicked',
      },
    ],
    USER_MSG,
  );
  assert(
    (affinity.get('behavioral_activation') ?? 0) > (affinity.get('self_care') ?? 0),
    'topicFree léxico prioriza intervención con mensaje similar',
  );

  const continuityTopic = buildTopicFreeFromContinuityItem({
    subtitle: 'Llamar a un amigo para salir a caminar un rato',
  });
  assert(
    continuityTopic?.includes('caminar'),
    'continuidad: topicFree desde subtítulo de strip',
  );

  const smokeCase = CHAT_BA_SMOKE_CASES[0];
  if (smokeCase?.message) {
    const ids = actionSuggestionService.generateSuggestions(
      { mainEmotion: 'tristeza', intensity: 6, topic: 'general' },
      {},
      { userContent: smokeCase.message },
    );
    assert(
      ids.includes('behavioral_activation'),
      'fixture chatBaSmokeCases dispara BA',
    );
  }

  if (process.exitCode) {
    console.error('\nSmoke intervention graph loop: FALLÓ');
    process.exit(1);
  }
  console.log('\nSmoke intervention graph loop: OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
