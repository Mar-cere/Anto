/**
 * Resolución de CTAs del check-in de ánimo del home (#34 / ritual #1).
 */

import { MOOD_OPTIONS } from './dailyMoodStorage';
import { getLastSessionDisplayText } from './dashboardHomeUtils';
import { isValidMongoObjectId24 } from './mongoId';

const VALID_MOOD = new Set(MOOD_OPTIONS);
const SECONDARY_KINDS = new Set([
  'breathing',
  'grounding',
  'ba_today',
  'resume_chat',
  'next_habit',
  'next_task',
]);

/**
 * @param {unknown} mood
 * @returns {mood is 'calm'|'anxious'|'tired'|'good'}
 */
export function isValidMoodCheckInKey(mood) {
  return VALID_MOOD.has(String(mood || '').trim());
}

/**
 * @param {{ mood?: string, suggestChat?: boolean }|null|undefined} checkIn
 * @returns {boolean}
 */
/**
 * @param {{ mood?: string, suggestChat?: boolean }|null|undefined} checkIn
 * @param {{ softLandingActive?: boolean }} [_opts] — reservado; el mute productivo va en secondary
 */
export function resolveMoodSuggestChat(checkIn, _opts = {}) {
  if (!isValidMoodCheckInKey(checkIn?.mood)) return false;
  if (typeof checkIn.suggestChat === 'boolean') return checkIn.suggestChat;
  return checkIn.mood === 'anxious' || checkIn.mood === 'tired';
}

/**
 * @param {{ acknowledgment?: string }|null|undefined} checkIn
 * @param {string|null|undefined} fallbackLine
 * @returns {string|null}
 */
export function resolveMoodAcknowledgment(checkIn, fallbackLine) {
  const ack = String(checkIn?.acknowledgment || '').trim();
  if (ack) return ack;
  const fallback = String(fallbackLine || '').trim();
  return fallback || null;
}

/**
 * Segunda acción contextual bajo el check-in.
 * @param {{
 *   checkIn?: { mood?: string }|null,
 *   focus?: {
 *     baWeekNext?: object|null,
 *     lastSessionSummary?: object|null,
 *     nextHabit?: object|null,
 *     nextTask?: object|null,
 *   }|null,
 *   softLandingActive?: boolean,
 * }} opts
 * @returns {{
 *   kind: 'breathing'|'grounding'|'ba_today'|'resume_chat'|'next_habit'|'next_task',
 *   labelKey: string,
 *   slotId?: string,
 *   conversationId?: string,
 *   habitId?: string,
 *   taskId?: string,
 *   nextHabit?: object,
 *   nextTask?: object,
 * }|null}
 */
export function resolveMoodSecondaryAction({ checkIn, focus, softLandingActive = false } = {}) {
  const mood = String(checkIn?.mood || '').trim();
  if (!isValidMoodCheckInKey(mood)) return null;

  // Soft landing (#225 v1.1): solo regulación o retomar chat; sin BA/hábito/tarea.
  if (softLandingActive === true) {
    if (mood === 'anxious') {
      return { kind: 'breathing', labelKey: 'MOOD_CTA_BREATHE' };
    }
    if (mood === 'tired') {
      return { kind: 'grounding', labelKey: 'MOOD_CTA_GROUNDING' };
    }
    if (mood === 'calm' || mood === 'good') {
      const last = focus?.lastSessionSummary;
      const continuityText = getLastSessionDisplayText(last);
      const conversationId = last?.conversationId ? String(last.conversationId).trim() : '';
      if (continuityText && isValidMongoObjectId24(conversationId)) {
        return {
          kind: 'resume_chat',
          labelKey: 'MOOD_CTA_RESUME_CHAT',
          conversationId,
        };
      }
    }
    return null;
  }

  if (mood === 'anxious') {
    return { kind: 'breathing', labelKey: 'MOOD_CTA_BREATHE' };
  }

  if (mood === 'tired') {
    const ba = focus?.baWeekNext;
    const slotId = ba?.slotId != null ? String(ba.slotId).trim() : '';
    if (ba?.isToday === true && slotId) {
      return {
        kind: 'ba_today',
        labelKey: 'MOOD_CTA_BA_TODAY',
        slotId,
      };
    }
    return { kind: 'grounding', labelKey: 'MOOD_CTA_GROUNDING' };
  }

  if (mood === 'calm' || mood === 'good') {
    const last = focus?.lastSessionSummary;
    const continuityText = getLastSessionDisplayText(last);
    const conversationId = last?.conversationId ? String(last.conversationId).trim() : '';
    if (continuityText && isValidMongoObjectId24(conversationId)) {
      return {
        kind: 'resume_chat',
        labelKey: 'MOOD_CTA_RESUME_CHAT',
        conversationId,
      };
    }
    if (focus?.nextHabit?._id) {
      return {
        kind: 'next_habit',
        labelKey: 'MOOD_CTA_NEXT_HABIT',
        habitId: String(focus.nextHabit._id),
        nextHabit: focus.nextHabit,
      };
    }
    if (focus?.nextTask?._id) {
      return {
        kind: 'next_task',
        labelKey: 'MOOD_CTA_NEXT_TASK',
        taskId: String(focus.nextTask._id),
        nextTask: focus.nextTask,
      };
    }
  }

  return null;
}

/**
 * @param {unknown} action
 * @returns {boolean}
 */
export function isValidMoodSecondaryAction(action) {
  if (!action || typeof action !== 'object') return false;
  const kind = String(action.kind || '').trim();
  if (!SECONDARY_KINDS.has(kind)) return false;
  if (kind === 'ba_today' && !String(action.slotId || '').trim()) return false;
  if (kind === 'resume_chat' && !isValidMongoObjectId24(String(action.conversationId || ''))) {
    return false;
  }
  if (kind === 'next_habit' && !action.nextHabit?._id) return false;
  if (kind === 'next_task' && !action.nextTask?._id) return false;
  return true;
}

/**
 * Evita chips redundantes: si ya hay «Retomar el chat», no mostrar «Contarle a Anto».
 * @param {{ kind?: string }|null|undefined} secondaryAction
 * @returns {boolean}
 */
export function shouldShowMoodOpenChatChip(secondaryAction) {
  return secondaryAction?.kind !== 'resume_chat';
}

/**
 * Texto humano del check-in colapsado (frase completa por ánimo, no plantilla forzada).
 * @param {string} mood
 * @param {Record<string, string>} texts
 * @returns {string}
 */
export function resolveMoodCollapsedLabel(mood, texts = {}) {
  const key = String(mood || '').trim();
  const byMood = {
    calm: texts.MOOD_COLLAPSED_CALM,
    anxious: texts.MOOD_COLLAPSED_ANXIOUS,
    tired: texts.MOOD_COLLAPSED_TIRED,
    good: texts.MOOD_COLLAPSED_GOOD,
  };
  const phrase = String(byMood[key] || '').trim();
  if (phrase) return phrase;
  const fallbackMood = String(texts[`MOOD_${key.toUpperCase()}`] || key).trim();
  return String(texts.MOOD_COLLAPSED_TODAY || '{mood}').replace('{mood}', fallbackMood);
}
