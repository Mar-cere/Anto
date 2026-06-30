/**
 * Iconos vectoriales por intervención (paridad visual en sugerencias de chat).
 * Complementa emojis del backend cuando faltan o en payloads históricos.
 */

const DEFAULT = {
  mciIcon: 'lightbulb-outline',
  emoji: '💡',
  accentKey: 'primary',
};

/** @type {Record<string, { mciIcon: string, emoji?: string, accentKey?: string }>} */
export const INTERVENTION_VISUALS = {
  breathing_exercise: { mciIcon: 'weather-windy', emoji: '🌬️', accentKey: 'primary' },
  grounding_technique: { mciIcon: 'earth', emoji: '🌍', accentKey: 'primary' },
  mindfulness_reminder: { mciIcon: 'meditation', emoji: '🧘', accentKey: 'primary' },
  self_care: { mciIcon: 'heart-pulse', emoji: '💆', accentKey: 'success' },
  self_compassion_exercise: { mciIcon: 'heart', emoji: '💚', accentKey: 'success' },
  support_contact: { mciIcon: 'phone', emoji: '📞', accentKey: 'primary' },
  gratitude_journal: { mciIcon: 'book-open-variant', emoji: '📔', accentKey: 'primary' },
  abc_record: { mciIcon: 'notebook-edit', emoji: '📝', accentKey: 'primary' },
  exposure_hierarchy: { mciIcon: 'stairs', emoji: '🪜', accentKey: 'warning' },
  behavioral_activation: { mciIcon: 'walk', emoji: '🚶', accentKey: 'primary' },
  automatic_thought_record: { mciIcon: 'thought-bubble', emoji: '💭', accentKey: 'primary' },
  timeout_technique: { mciIcon: 'pause-circle-outline', emoji: '⏸️', accentKey: 'warning' },
  communication_tool: { mciIcon: 'message-text', emoji: '💬', accentKey: 'primary' },
  boundary_setting: { mciIcon: 'shield-account', emoji: '🛡️', accentKey: 'error' },
  task_break: { mciIcon: 'coffee', emoji: '☕', accentKey: 'primary' },
  grief_support: { mciIcon: 'candle', emoji: '🕯️', accentKey: 'primary' },
  memory_exercise: { mciIcon: 'notebook', emoji: '📝', accentKey: 'primary' },
  connection_exercise: { mciIcon: 'handshake', emoji: '🤝', accentKey: 'primary' },
  social_activity: { mciIcon: 'account-group', emoji: '👥', accentKey: 'primary' },
  activity_suggestion: { mciIcon: 'star-four-points', emoji: '✨', accentKey: 'primary' },
  performance_anxiety_tool: { mciIcon: 'microphone', emoji: '🎤', accentKey: 'warning' },
  present_moment_exercise: { mciIcon: 'circle-opacity', emoji: '🫧', accentKey: 'primary' },
  social_anxiety_tool: { mciIcon: 'account-heart', emoji: '🧑‍🤝‍🧑', accentKey: 'primary' },
  exposure_guide: { mciIcon: 'stairs', emoji: '🪜', accentKey: 'warning' },
  reframing_tool: { mciIcon: 'sync', emoji: '🔁', accentKey: 'primary' },
  task_organization: { mciIcon: 'folder-multiple', emoji: '🗂️', accentKey: 'primary' },
  time_management: { mciIcon: 'timer-outline', emoji: '⏱️', accentKey: 'primary' },
  anger_management: { mciIcon: 'fire-extinguisher', emoji: '🧯', accentKey: 'error' },
  physical_activity: { mciIcon: 'run', emoji: '🚶', accentKey: 'success' },
  forgiveness_work: { mciIcon: 'dove', emoji: '🕊️', accentKey: 'primary' },
  values_exploration: { mciIcon: 'compass', emoji: '🧭', accentKey: 'primary' },
  apology_guide: { mciIcon: 'hand-heart', emoji: '🙏', accentKey: 'primary' },
  grief_roadmap: { mciIcon: 'candle', emoji: '🕯️', accentKey: 'primary' },
  relapse_prevention: { mciIcon: 'shield-check', emoji: '🛡️', accentKey: 'primary' },
  dbt_stop_skill: { mciIcon: 'stop-circle', emoji: '🛑', accentKey: 'error' },
  act_values_check: { mciIcon: 'compass', emoji: '🧭', accentKey: 'primary' },
  sleep_diary_lite: { mciIcon: 'sleep', emoji: '🌙', accentKey: 'primary' },
  mindfulness_sequence: { mciIcon: 'meditation', emoji: '🧘', accentKey: 'primary' },
  assertive_i_messages: { mciIcon: 'message-text', emoji: '💬', accentKey: 'primary' },
  psychoeducation_anxiety: { mciIcon: 'weather-windy', emoji: '📚', accentKey: 'primary' },
  psychoeducation_anxiety_advanced: { mciIcon: 'weather-windy', emoji: '📚', accentKey: 'primary' },
  psychoeducation_depression: { mciIcon: 'weather-cloudy', emoji: '📚', accentKey: 'primary' },
  psychoeducation_depression_advanced: { mciIcon: 'weather-cloudy', emoji: '📚', accentKey: 'primary' },
  psychoeducation_stress: { mciIcon: 'flash', emoji: '📚', accentKey: 'warning' },
  psychoeducation_work_stress: { mciIcon: 'briefcase-outline', emoji: '📚', accentKey: 'warning' },
  psychoeducation_anger: { mciIcon: 'fire', emoji: '📚', accentKey: 'error' },
  psychoeducation_sleep: { mciIcon: 'sleep', emoji: '📚', accentKey: 'primary' },
  psychoeducation_emotion_regulation: { mciIcon: 'heart-pulse', emoji: '📚', accentKey: 'success' },
  psychoeducation_trauma: { mciIcon: 'shield-heart', emoji: '📚', accentKey: 'primary' },
  psychoeducation_grief: { mciIcon: 'flower', emoji: '📚', accentKey: 'primary' },
  psychoeducation_burnout: { mciIcon: 'battery-low', emoji: '📚', accentKey: 'warning' },
};

/** Continuidad TCC en chat (kind del backend). */
export const TCC_CONTINUITY_VISUALS = {
  behavioral_activation: { mciIcon: 'walk', accentKey: 'primary' },
  exposure_hierarchy: { mciIcon: 'stairs', accentKey: 'warning' },
  automatic_thought_record: { mciIcon: 'thought-bubble', accentKey: 'primary' },
  abc_record: { mciIcon: 'notebook-edit', accentKey: 'primary' },
};

/**
 * @param {string|null|undefined} interventionId
 * @returns {{ mciIcon: string, emoji: string, accentKey: string }}
 */
export function resolveInterventionVisual(interventionId) {
  const id = String(interventionId || '').trim().toLowerCase();
  const entry = INTERVENTION_VISUALS[id];
  if (!entry) return { ...DEFAULT };
  return {
    mciIcon: entry.mciIcon || DEFAULT.mciIcon,
    emoji: entry.emoji || DEFAULT.emoji,
    accentKey: entry.accentKey || DEFAULT.accentKey,
  };
}

/**
 * @param {string|null|undefined} kind
 * @returns {{ mciIcon: string, accentKey: string }}
 */
export function resolveTccContinuityVisual(kind) {
  const key = String(kind || '').trim();
  const entry = TCC_CONTINUITY_VISUALS[key];
  if (!entry) return { mciIcon: 'arrow-right-circle-outline', accentKey: 'primary' };
  return entry;
}

/**
 * @param {import('../styles/themePalettes').lightColors} colors
 * @param {string} accentKey
 */
export function resolveVisualAccent(colors, accentKey = 'primary') {
  const map = {
    primary: colors.primary,
    warning: colors.warning,
    error: colors.error,
    success: colors.success,
  };
  const accent = map[accentKey] || colors.primary;
  return {
    accent,
    iconBg: colors.accentLineSoft ?? `${accent}18`,
  };
}
