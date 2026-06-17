/**
 * Registra eventos del grafo tema–intervención (#127), best-effort.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import chatService from '../services/chatService';
import { CHAT_SESSION_KEYS } from './chatSessionStorage';

const INTERVENTION_ID_PATTERN = /^[a-z][a-z0-9_]{0,79}$/;

function normalizeInterventionId(interventionId) {
  const id = String(interventionId || '').trim().toLowerCase();
  if (!id || !INTERVENTION_ID_PATTERN.test(id)) return null;
  return id;
}

function submitInterventionEventBestEffort(interventionId, eventType, options = {}) {
  const id = normalizeInterventionId(interventionId);
  const ev = String(eventType || '').trim();
  if (!id) return;
  if (!['clicked', 'dismissed', 'completed', 'opened', 'shown'].includes(ev)) return;

  const payload = {
    interventionId: id,
    eventType: ev,
    ...(options.topicTag ? { topicTag: options.topicTag } : {}),
    ...(options.topicFree ? { topicFree: options.topicFree } : {}),
    ...(options.source ? { source: options.source } : {}),
  };

  AsyncStorage.getItem(CHAT_SESSION_KEYS.CONVERSATION_ID)
    .then((convId) => {
      const cid = String(convId || '').trim();
      if (/^[\da-f]{24}$/i.test(cid)) {
        if (ev === 'opened' || ev === 'shown') {
          return chatService.submitUserInterventionEvent(payload);
        }
        return chatService.submitInterventionEvent(cid, {
          interventionId: id,
          eventType: ev,
        });
      }
      return chatService.submitUserInterventionEvent(payload);
    })
    .catch(() => {});
}

export function recordInterventionCompleted(interventionId, options) {
  submitInterventionEventBestEffort(interventionId, 'completed', options);
}

export function recordInterventionClicked(interventionId, options) {
  submitInterventionEventBestEffort(interventionId, 'clicked', options);
}

export function recordInterventionDismissed(interventionId, options) {
  submitInterventionEventBestEffort(interventionId, 'dismissed', options);
}

/**
 * Biblioteca / técnicas: registra shown + clicked aunque no haya chat activo (#127).
 */
export function recordLibraryInterventionOpened(interventionId, options = {}) {
  submitInterventionEventBestEffort(interventionId, 'opened', {
    source: 'library_v1',
    topicTag: 'library',
    ...options,
  });
}

/**
 * Sugerencias sin wizard propio: el tap en chat cierra el bucle (#127).
 * @param {{ id?: string, interventionType?: string, screen?: string|null }} suggestion
 */
export function shouldRecordInterventionCompletedOnSuggestionPress(suggestion) {
  if (!suggestion?.id) return false;
  const type = String(suggestion.interventionType || '').trim();
  if (type === 'micro_guide') return true;
  if (type === 'support' && suggestion.screen) return true;
  return false;
}

export function recordInterventionCompletedIfInlineSuggestion(suggestion) {
  if (shouldRecordInterventionCompletedOnSuggestionPress(suggestion)) {
    recordInterventionCompleted(suggestion.id);
  }
}

/**
 * Igual que recordInterventionCompleted pero solo una vez por montaje de pantalla.
 */
export function createInterventionCompletedRecorder() {
  let recorded = false;
  return (interventionId, options) => {
    if (recorded) return;
    recorded = true;
    recordInterventionCompleted(interventionId, options);
  };
}
