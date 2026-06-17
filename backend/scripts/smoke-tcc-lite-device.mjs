#!/usr/bin/env node
/**
 * Smoke estático TCC lite + AT (#201 / #89) — sin DB ni red.
 */
import { planChatTccLite, buildAtHandoffFromTccLiteSession } from '../services/chatTccLiteService.js';
import { buildClientTurnPayload } from '../services/chatTurnEnhancementsService.js';
import actionSuggestionService, {
  applyAutomaticThoughtSuggestionPolicy,
} from '../services/actionSuggestionService.js';

const CANONICAL =
  'Seguro que todo va a salir mal y nunca voy a poder con esto';

let failed = 0;

function ok(label, condition, detail = '') {
  if (condition) {
    console.log(`  [OK] ${label}`);
  } else {
    console.log(`  [FAIL] ${label}${detail ? ` — ${detail}` : ''}`);
    failed += 1;
  }
}

console.log('\n=== Smoke TCC lite (#201) + AT (#89) ===\n');

const plan = planChatTccLite({
  userContent: CANONICAL,
  contextualAnalysis: {
    primaryDistortion: {
      type: 'catastrophizing',
      name: 'Catastrofismo',
      confidence: 0.8,
    },
  },
  emotionalAnalysis: { mainEmotion: 'ansiedad', intensity: 7 },
  conversationHistory: [],
  riskLevel: 'LOW',
  sessionIntention: null,
  language: 'es',
});

ok('TCC lite activa con distorsión', plan.active === true);
ok('Paso inicial capture_thought', plan.step === 'capture_thought');
ok('Snippet LLM presente', Boolean(plan.promptSnippet));

const clientTurn = buildClientTurnPayload({
  tccLitePlan: plan,
  suggestionPlan: {
    shouldShow: true,
    formatted: actionSuggestionService.formatSuggestions(['automatic_thought_record'], 'es'),
    rankingPersonalized: false,
  },
  language: 'es',
});

ok('Payload cliente incluye tccLite activo', clientTurn.tccLite?.active === true);
ok('Sugerencia AT formateada', clientTurn.suggestions?.[0]?.screen === 'AutomaticThoughtRecord');

const atIds = applyAutomaticThoughtSuggestionPolicy(['abc_record', 'mindfulness_reminder'], {
  emotion: 'ansiedad',
  intensityLevel: 'medium',
  userContent:
    'Me siento ansioso, 6/10. Sé que van a pensar mal de mí y nunca va a salir bien.',
});
ok('Política AT prioriza con distorsión', atIds[0] === 'automatic_thought_record');

const handoff = buildAtHandoffFromTccLiteSession({
  conversationHistory: [
    { role: 'user', content: 'Creo que voy a fracasar en todo' },
    { role: 'user', content: 'En la reunión de mañana me van a despedir' },
    { role: 'user', content: 'Quizá no es seguro al 100%, pero puedo prepararme' },
  ],
  distortionType: 'catastrophizing',
  language: 'es',
});

ok('Handoff AT desde sesión TCC lite', handoff?.screen === 'AutomaticThoughtRecord');
ok('Handoff incluye prefillAutomaticThought', Boolean(handoff?.params?.prefillAutomaticThought));

console.log('');
if (failed > 0) {
  console.error(`❌ Smoke TCC lite falló (${failed} checks)`);
  process.exit(1);
}
console.log('✅ Smoke TCC lite OK — listo para prueba en dispositivo\n');
