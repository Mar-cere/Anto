/**
 * Pesos de señales para la racha de ecosistema (chat primario + crédito parcial).
 */
export const ENGAGEMENT_QUALIFY_THRESHOLD = 1;

/** @typedef {'chat_user_message'|'task_completed'|'habit_completed'|'technique_completed'|'psychoeducation_completed'|'mood_checkin'} EngagementSignal */

export const ENGAGEMENT_SIGNAL = {
  CHAT_USER_MESSAGE: 'chat_user_message',
  TASK_COMPLETED: 'task_completed',
  HABIT_COMPLETED: 'habit_completed',
  TECHNIQUE_COMPLETED: 'technique_completed',
  PSYCHOEDUCATION_COMPLETED: 'psychoeducation_completed',
  MOOD_CHECKIN: 'mood_checkin',
};

/** @type {Record<EngagementSignal, { weight: number, qualifiesAlone: boolean }>} */
export const ENGAGEMENT_SIGNAL_WEIGHTS = {
  [ENGAGEMENT_SIGNAL.CHAT_USER_MESSAGE]: { weight: 1, qualifiesAlone: true },
  [ENGAGEMENT_SIGNAL.TASK_COMPLETED]: { weight: 0.5, qualifiesAlone: false },
  [ENGAGEMENT_SIGNAL.HABIT_COMPLETED]: { weight: 0.5, qualifiesAlone: false },
  [ENGAGEMENT_SIGNAL.TECHNIQUE_COMPLETED]: { weight: 0.45, qualifiesAlone: false },
  [ENGAGEMENT_SIGNAL.PSYCHOEDUCATION_COMPLETED]: { weight: 0.35, qualifiesAlone: false },
  [ENGAGEMENT_SIGNAL.MOOD_CHECKIN]: { weight: 0.25, qualifiesAlone: false },
};

export function getEngagementSignalWeight(signal) {
  return ENGAGEMENT_SIGNAL_WEIGHTS[signal]?.weight ?? 0;
}

export function engagementSignalQualifiesAlone(signal) {
  return Boolean(ENGAGEMENT_SIGNAL_WEIGHTS[signal]?.qualifiesAlone);
}
