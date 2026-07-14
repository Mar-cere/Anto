/**
 * Mantiene actualizada la zona horaria del usuario (preferences.timezone) para que el
 * scheduler de notificaciones envíe siempre en hora local, incluso si el usuario viaja
 * o cambia de país. Corre en toda la app autenticada: al iniciar y cada vez que la app
 * vuelve a primer plano (detecta cambios de zona sin depender de la pantalla de ajustes).
 */
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { api, ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';

function guessDeviceTimezone() {
  try {
    const tz = Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone;
    if (typeof tz === 'string' && tz.includes('/')) return tz;
  } catch {}
  return null;
}

export default function DeviceTimezoneSync() {
  const { user, applyLocalUser } = useAuth();
  const runningRef = useRef(false);
  const preferencesRef = useRef(user?.preferences || {});
  const userId = user?._id ?? user?.id ?? null;
  const userTimezone =
    typeof user?.preferences?.timezone === 'string' ? user.preferences.timezone : null;

  preferencesRef.current = user?.preferences || {};

  useEffect(() => {
    if (!userId) return undefined;

    const maybeSync = async () => {
      if (runningRef.current) return;
      const deviceTz = guessDeviceTimezone();
      if (!deviceTz) return;
      if (userTimezone === deviceTz) return;

      runningRef.current = true;
      try {
        const currentPreferences = preferencesRef.current || {};
        const result = await api.put(ENDPOINTS.UPDATE_PROFILE, {
          preferences: { ...currentPreferences, timezone: deviceTz },
        });
        if (result?.user && typeof applyLocalUser === 'function') {
          await applyLocalUser(result.user);
        }
      } catch {
        // best-effort: no bloquear UX si falla la sincronización
      } finally {
        runningRef.current = false;
      }
    };

    void maybeSync();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void maybeSync();
    });
    return () => sub.remove();
  }, [applyLocalUser, userId, userTimezone]);

  return null;
}
