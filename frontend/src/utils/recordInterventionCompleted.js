/**
 * Registra evento `completed` del grafo tema–intervención (#127), best-effort.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import chatService from '../services/chatService';
import { CHAT_SESSION_KEYS } from './chatSessionStorage';

const INTERVENTION_ID_PATTERN = /^[a-z][a-z0-9_]{0,79}$/;

function submitInterventionEventBestEffort(interventionId, eventType) {
  const id = String(interventionId || '').trim().toLowerCase();
  const ev = String(eventType || '').trim();
  if (!id || !INTERVENTION_ID_PATTERN.test(id)) return;
  if (!['clicked', 'dismissed', 'completed'].includes(ev)) return;
  AsyncStorage.getItem(CHAT_SESSION_KEYS.CONVERSATION_ID)
    .then((convId) => {
      if (!convId || !/^[\da-f]{24}$/i.test(String(convId).trim())) return null;
      return chatService.submitInterventionEvent(convId, {
        interventionId: id,
        eventType: ev,
      });
    })
    .catch(() => {});
}

export function recordInterventionCompleted(interventionId) {
  submitInterventionEventBestEffort(interventionId, 'completed');
}

export function recordInterventionClicked(interventionId) {
  submitInterventionEventBestEffort(interventionId, 'clicked');
}

export function recordInterventionDismissed(interventionId) {
  submitInterventionEventBestEffort(interventionId, 'dismissed');
}

/**
 * Igual que recordInterventionCompleted pero solo una vez por montaje de pantalla.
 */
export function createInterventionCompletedRecorder() {
  let recorded = false;
  return (interventionId) => {
    if (recorded) return;
    recorded = true;
    recordInterventionCompleted(interventionId);
  };
}
