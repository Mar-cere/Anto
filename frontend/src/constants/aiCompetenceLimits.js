/**
 * Identificadores de la biblioteca de límites de competencia IA (#194).
 * El copy vive en INFO.AI_LIMITS_LIBRARY (es/en).
 */
export const AI_LIMIT_TOPIC = {
  GENERAL: 'general',
  NOT_THERAPY: 'not_therapy',
  CRISIS: 'crisis',
  HUMAN_HELP: 'human_help',
  EMERGENCY_CONTACTS: 'emergency_contacts',
  CHAT_ACTIONS: 'chat_actions',
  NO_DIAGNOSIS: 'no_diagnosis',
  MEMORY: 'memory',
};

/** Orden de la biblioteca completa en AIPrivacyScreen */
export const AI_LIMIT_LIBRARY_ORDER = [
  AI_LIMIT_TOPIC.GENERAL,
  AI_LIMIT_TOPIC.NOT_THERAPY,
  AI_LIMIT_TOPIC.NO_DIAGNOSIS,
  AI_LIMIT_TOPIC.CRISIS,
  AI_LIMIT_TOPIC.HUMAN_HELP,
  AI_LIMIT_TOPIC.EMERGENCY_CONTACTS,
  AI_LIMIT_TOPIC.CHAT_ACTIONS,
  AI_LIMIT_TOPIC.MEMORY,
];

export function isValidAiLimitTopicId(id) {
  return typeof id === 'string' && AI_LIMIT_LIBRARY_ORDER.includes(id);
}
