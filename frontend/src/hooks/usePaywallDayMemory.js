import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { api, ENDPOINTS } from '../config/api';
import { STORAGE_KEYS as CHAT_STORAGE_KEYS } from '../screens/chat/chatScreenConstants';
import { fetchTodayMoodCheckIn } from '../services/dailyMoodService';
import { getMessages } from '../services/chatService';
import { inferFirstCheckInToday } from '../utils/paywallMemoryCopy';

function isToday(dateLike) {
  if (!dateLike) return false;
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

/**
 * Actividad del día para el bloque de memoria del paywall (solo lectura en cliente).
 */
export function usePaywallDayMemory() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mood, habitsRaw, tasksRaw] = await Promise.all([
        fetchTodayMoodCheckIn(),
        api.get(ENDPOINTS.HABITS).catch(() => []),
        api.get(ENDPOINTS.TASKS).catch(() => []),
      ]);

      let chatMessagesToday = 0;
      try {
        const convId = await AsyncStorage.getItem(CHAT_STORAGE_KEYS.CONVERSATION_ID);
        if (convId) {
          const { messages } = await getMessages(convId, { limit: 50 });
          chatMessagesToday = normalizeList(messages).filter(
            (m) =>
              m?.role === 'user' &&
              isToday(m.createdAt || m.timestamp || m.metadata?.timestamp),
          ).length;
        }
      } catch {
        /* sin conversación activa */
      }

      const habits = normalizeList(habitsRaw);
      const tasks = normalizeList(tasksRaw);

      const nextStats = {
        hasCheckIn: Boolean(mood?.mood),
        habitsStartedToday: habits.filter((h) => isToday(h.createdAt)).length,
        tasksCompletedToday: tasks.filter(
          (t) => t?.completed && isToday(t.completedAt || t.updatedAt),
        ).length,
        chatMessagesToday,
      };
      nextStats.isFirstCheckIn = inferFirstCheckInToday(nextStats);
      setStats(nextStats);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { loading, stats, reload: load };
}
