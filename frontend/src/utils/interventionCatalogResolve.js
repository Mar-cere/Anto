/**
 * Resolución de IDs del catálogo #127 desde pantallas/técnicas (biblioteca).
 */

const INTERVENTION_ID_PATTERN = /^[a-z][a-z0-9_]{0,79}$/;

const SCREEN_TO_INTERVENTION_ID = Object.freeze({
  BreathingExercise: 'breathing_exercise',
  GroundingTechnique: 'grounding_technique',
  Mindfulness: 'mindfulness_reminder',
  SelfCare: 'self_care',
  SelfCompassion: 'self_compassion_exercise',
  Profile: 'support_contact',
  GratitudeJournal: 'gratitude_journal',
  AbcRecord: 'abc_record',
  ExposureHierarchy: 'exposure_hierarchy',
  BehavioralActivation: 'behavioral_activation',
  AutomaticThoughtRecord: 'automatic_thought_record',
  TimeoutTechnique: 'timeout_technique',
  CommunicationTool: 'communication_tool',
  BoundarySetting: 'boundary_setting',
  TaskBreak: 'task_break',
  GriefSupport: 'grief_support',
  MemoryExercise: 'memory_exercise',
  ConnectionExercise: 'connection_exercise',
  SocialActivity: 'social_activity',
  ActivitySuggestion: 'activity_suggestion',
  PsychoeducationModule: null,
});

const PSYCHOEDUCATION_TOPIC_TO_ID = Object.freeze({
  anxiety: 'psychoeducation_anxiety',
  depression: 'psychoeducation_depression',
  stress: 'psychoeducation_stress',
  anger: 'psychoeducation_anger',
  sleep: 'psychoeducation_sleep',
  emotionregulation: 'psychoeducation_emotion_regulation',
  emotion_regulation: 'psychoeducation_emotion_regulation',
  trauma: 'psychoeducation_trauma',
  grief: 'psychoeducation_grief',
  burnout: 'psychoeducation_burnout',
});

function normalizeInterventionId(id) {
  const key = String(id || '').trim().toLowerCase();
  if (!key || !INTERVENTION_ID_PATTERN.test(key)) return null;
  return key;
}

export function getInterventionIdByScreen(screen) {
  const key = String(screen || '').trim();
  if (!key) return null;
  return normalizeInterventionId(SCREEN_TO_INTERVENTION_ID[key]);
}

export function getPsychoeducationInterventionId(topic) {
  const raw = String(topic || '').trim();
  if (!raw) return null;
  const slug = raw.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
  return normalizeInterventionId(
    PSYCHOEDUCATION_TOPIC_TO_ID[slug] || `psychoeducation_${slug}`,
  );
}

/**
 * @param {{ id?: string, name?: string, linkedScreen?: string, type?: string, category?: string }} technique
 */
export function resolveInterventionIdFromTechnique(technique) {
  if (!technique || typeof technique !== 'object') return null;

  const linkedScreen =
    typeof technique.linkedScreen === 'string' ? technique.linkedScreen.trim() : '';
  const fromScreen = getInterventionIdByScreen(linkedScreen);
  if (fromScreen) return fromScreen;

  const direct = normalizeInterventionId(technique.interventionId || technique.id);
  if (direct) return direct;

  return null;
}
