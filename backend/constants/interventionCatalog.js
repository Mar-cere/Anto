/**
 * Catálogo canónico de intervenciones para sugerencias y grafo (#127).
 * Importante:
 * - IDs deben ser estables (persisten en eventos).
 * - Este catálogo es “producto”: controla etiquetas, tipo y pantallas destino.
 */
import { normalizeApiLanguage } from '../utils/apiLanguage.js';
import { INTERVENTION_LABELS_EN } from './interventionCatalogLabels.en.js';

export const INTERVENTION_CATALOG = {
  breathing_exercise: {
    id: 'breathing_exercise',
    label: 'Ejercicio de Respiración',
    icon: '🌬️',
    screen: 'BreathingExercise',
    type: 'technique',
    tags: ['regulacion', 'ansiedad'],
  },
  grounding_technique: {
    id: 'grounding_technique',
    label: 'Técnica de Grounding',
    icon: '🌍',
    screen: 'GroundingTechnique',
    type: 'technique',
    tags: ['regulacion', 'ansiedad'],
  },
  mindfulness_reminder: {
    id: 'mindfulness_reminder',
    label: 'Recordatorio de Mindfulness',
    icon: '🧘',
    screen: 'Mindfulness',
    type: 'technique',
    tags: ['mindfulness', 'regulacion'],
  },
  self_care: {
    id: 'self_care',
    label: 'Autocuidado',
    icon: '💆',
    screen: 'SelfCare',
    type: 'technique',
    tags: ['autocuidado'],
  },
  self_compassion_exercise: {
    id: 'self_compassion_exercise',
    label: 'Ejercicio de Autocompasión',
    icon: '💚',
    screen: 'SelfCompassion',
    type: 'technique',
    tags: ['autocompasion', 'culpa', 'verguenza'],
  },
  support_contact: {
    id: 'support_contact',
    label: 'Contactar Apoyo',
    icon: '📞',
    screen: 'Profile',
    type: 'support',
    tags: ['apoyo', 'seguridad'],
  },
  gratitude_journal: {
    id: 'gratitude_journal',
    label: 'Diario de Gratitud',
    icon: '📔',
    screen: 'GratitudeJournal',
    type: 'exercise',
    tags: ['gratitud', 'bienestar'],
  },
  timeout_technique: {
    id: 'timeout_technique',
    label: 'Técnica de Tiempo Fuera',
    icon: '⏸️',
    screen: 'TimeoutTechnique',
    type: 'technique',
    tags: ['enojo', 'regulacion'],
  },
  communication_tool: {
    id: 'communication_tool',
    label: 'Herramienta de Comunicación',
    icon: '💬',
    screen: 'CommunicationTool',
    type: 'exercise',
    tags: ['relaciones', 'asertividad'],
  },
  boundary_setting: {
    id: 'boundary_setting',
    label: 'Establecer Límites',
    icon: '🛡️',
    screen: 'BoundarySetting',
    type: 'exercise',
    tags: ['relaciones', 'asertividad'],
  },
  task_break: {
    id: 'task_break',
    label: 'Tomar un Descanso',
    icon: '☕',
    screen: 'TaskBreak',
    type: 'technique',
    tags: ['trabajo', 'regulacion'],
  },
  grief_support: {
    id: 'grief_support',
    label: 'Apoyo en el Duelo',
    icon: '🕯️',
    screen: 'GriefSupport',
    type: 'support',
    tags: ['perdida', 'tristeza'],
  },
  memory_exercise: {
    id: 'memory_exercise',
    label: 'Ejercicio de Memoria',
    icon: '📝',
    screen: 'MemoryExercise',
    type: 'exercise',
    tags: ['perdida', 'tristeza'],
  },
  connection_exercise: {
    id: 'connection_exercise',
    label: 'Ejercicio de Conexión',
    icon: '🤝',
    screen: 'ConnectionExercise',
    type: 'exercise',
    tags: ['soledad', 'relaciones'],
  },
  social_activity: {
    id: 'social_activity',
    label: 'Actividad Social',
    icon: '👥',
    screen: 'SocialActivity',
    type: 'exercise',
    tags: ['soledad', 'relaciones'],
  },
  activity_suggestion: {
    id: 'activity_suggestion',
    label: 'Sugerencia de Actividad',
    icon: '✨',
    screen: 'ActivitySuggestion',
    type: 'exercise',
    tags: ['bienestar', 'tristeza'],
  },
  // Fallbacks humanizados (sin pantalla dedicada).
  performance_anxiety_tool: {
    id: 'performance_anxiety_tool',
    label: 'Ansiedad por Rendimiento (guía breve)',
    icon: '🎤',
    screen: null,
    type: 'micro_guide',
    tags: ['ansiedad'],
  },
  present_moment_exercise: {
    id: 'present_moment_exercise',
    label: 'Volver al Presente (ejercicio breve)',
    icon: '🫧',
    screen: null,
    type: 'micro_guide',
    tags: ['mindfulness', 'regulacion'],
  },
  social_anxiety_tool: {
    id: 'social_anxiety_tool',
    label: 'Ansiedad Social (guía breve)',
    icon: '🧑‍🤝‍🧑',
    screen: null,
    type: 'micro_guide',
    tags: ['ansiedad', 'relaciones'],
  },
  exposure_guide: {
    id: 'exposure_guide',
    label: 'Exposición Gradual (guía breve)',
    icon: '🪜',
    screen: null,
    type: 'micro_guide',
    tags: ['ansiedad'],
  },
  reframing_tool: {
    id: 'reframing_tool',
    label: 'Reencuadre (cambiar perspectiva)',
    icon: '🔁',
    screen: null,
    type: 'micro_guide',
    tags: ['tcc', 'pensamientos'],
  },
  task_organization: {
    id: 'task_organization',
    label: 'Organizar Tareas (pasos rápidos)',
    icon: '🗂️',
    screen: null,
    type: 'micro_guide',
    tags: ['organizacion', 'trabajo'],
  },
  time_management: {
    id: 'time_management',
    label: 'Gestión del Tiempo (tip rápido)',
    icon: '⏱️',
    screen: null,
    type: 'micro_guide',
    tags: ['organizacion', 'trabajo'],
  },
  anger_management: {
    id: 'anger_management',
    label: 'Manejar el Enojo (guía breve)',
    icon: '🧯',
    screen: null,
    type: 'micro_guide',
    tags: ['enojo', 'regulacion'],
  },
  physical_activity: {
    id: 'physical_activity',
    label: 'Movimiento Suave',
    icon: '🚶',
    screen: null,
    type: 'micro_guide',
    tags: ['autocuidado'],
  },
  forgiveness_work: {
    id: 'forgiveness_work',
    label: 'Perdón (ejercicio breve)',
    icon: '🕊️',
    screen: null,
    type: 'micro_guide',
    tags: ['culpa'],
  },
  values_exploration: {
    id: 'values_exploration',
    label: 'Explorar Valores (guía breve)',
    icon: '🧭',
    screen: null,
    type: 'micro_guide',
    tags: ['act', 'valores'],
  },
  apology_guide: {
    id: 'apology_guide',
    label: 'Pedir Disculpas (guía breve)',
    icon: '🙏',
    screen: null,
    type: 'micro_guide',
    tags: ['relaciones'],
  },

  // Psicoeducación (módulos backend: /api/therapeutic-techniques/psychoeducation/:topic)
  psychoeducation_anxiety: {
    id: 'psychoeducation_anxiety',
    label: 'Entender la Ansiedad (psicoeducación)',
    labelEn: 'Understanding Anxiety (psychoeducation)',
    icon: '📚',
    screen: 'PsychoeducationModule',
    type: 'psychoeducation',
    tags: ['ansiedad'],
    params: { topic: 'anxiety' },
  },
  psychoeducation_depression: {
    id: 'psychoeducation_depression',
    label: 'Entender la Depresión (psicoeducación)',
    labelEn: 'Understanding Low Mood (psychoeducation)',
    icon: '📚',
    screen: 'PsychoeducationModule',
    type: 'psychoeducation',
    tags: ['tristeza'],
    params: { topic: 'depression' },
  },
  psychoeducation_stress: {
    id: 'psychoeducation_stress',
    label: 'Entender el Estrés (psicoeducación)',
    labelEn: 'Understanding Stress (psychoeducation)',
    icon: '📚',
    screen: 'PsychoeducationModule',
    type: 'psychoeducation',
    tags: ['estres'],
    params: { topic: 'stress' },
  },
  psychoeducation_anger: {
    id: 'psychoeducation_anger',
    label: 'Enojo e ira (psicoeducación)',
    labelEn: 'Anger (psychoeducation)',
    icon: '📚',
    screen: 'PsychoeducationModule',
    type: 'psychoeducation',
    tags: ['enojo', 'ira'],
    params: { topic: 'anger' },
  },
  psychoeducation_sleep: {
    id: 'psychoeducation_sleep',
    label: 'Sueño e higiene del descanso',
    labelEn: 'Sleep and rest hygiene',
    icon: '📚',
    screen: 'PsychoeducationModule',
    type: 'psychoeducation',
    tags: ['sueño', 'insomnio'],
    params: { topic: 'sleep' },
  },
  psychoeducation_emotion_regulation: {
    id: 'psychoeducation_emotion_regulation',
    label: 'Regulación emocional (psicoeducación)',
    labelEn: 'Emotion Regulation (psychoeducation)',
    icon: '📚',
    screen: 'PsychoeducationModule',
    type: 'psychoeducation',
    tags: ['regulacion', 'emociones'],
    params: { topic: 'emotionRegulation' },
  },
  psychoeducation_trauma: {
    id: 'psychoeducation_trauma',
    label: 'Experiencias difíciles (informado en trauma)',
    labelEn: 'Difficult Experiences (trauma-informed)',
    icon: '📚',
    screen: 'PsychoeducationModule',
    type: 'psychoeducation',
    tags: ['trauma'],
    params: { topic: 'trauma' },
  },
};

/** IDs estables: snake_case, máx. 80 caracteres. */
export const INTERVENTION_ID_MAX_LENGTH = 80;
export const INTERVENTION_ID_PATTERN = /^[a-z][a-z0-9_]{0,79}$/;

export function normalizeInterventionId(id) {
  return String(id || '').trim().toLowerCase();
}

export function isValidInterventionId(id) {
  const key = normalizeInterventionId(id);
  if (!key || key.length > INTERVENTION_ID_MAX_LENGTH) return false;
  return INTERVENTION_ID_PATTERN.test(key);
}

export function getInterventionCatalogEntry(id) {
  const key = normalizeInterventionId(id);
  if (!key) return null;
  return INTERVENTION_CATALOG[key] || null;
}

export function listCatalogInterventionIds() {
  return Object.keys(INTERVENTION_CATALOG);
}

/**
 * @param {object|null} entry
 * @param {string} [language='es']
 */
export function getInterventionCatalogLabel(entry, language = 'es') {
  if (!entry) return '';
  const lang = normalizeApiLanguage(language);
  if (lang === 'en') {
    const mapped = INTERVENTION_LABELS_EN[entry.id];
    if (typeof mapped === 'string' && mapped.trim()) return mapped.trim();
    if (typeof entry.labelEn === 'string' && entry.labelEn.trim()) {
      return entry.labelEn.trim();
    }
  }
  return String(entry.label || '').trim();
}

