/**
 * Persiste regionCountry (ISO desde locale del dispositivo) al iniciar sesión, sin GPS.
 * Complementa timezone en useSettingsScreen; corre en toda la app autenticada.
 */
import { useEffect, useRef } from 'react';
import { api, ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { inferDeviceRegionCountry } from '../utils/deviceRegion';

export default function DeviceRegionSync() {
  const { user, applyLocalUser } = useAuth();
  const syncedRef = useRef(false);
  const preferencesRef = useRef(user?.preferences || {});
  const userId = user?._id ?? user?.id ?? null;
  const userRegionCountry =
    user?.preferences?.regionCountry != null && String(user.preferences.regionCountry).trim()
      ? String(user.preferences.regionCountry).trim()
      : null;

  preferencesRef.current = user?.preferences || {};

  useEffect(() => {
    syncedRef.current = false;
  }, [userId]);

  useEffect(() => {
    if (!userId || syncedRef.current) return;

    if (userRegionCountry) {
      syncedRef.current = true;
      return;
    }

    const iso = inferDeviceRegionCountry();
    if (!iso) {
      syncedRef.current = true;
      return;
    }

    syncedRef.current = true;
    (async () => {
      try {
        const currentPreferences = preferencesRef.current || {};
        const result = await api.put(ENDPOINTS.UPDATE_PROFILE, {
          preferences: { ...currentPreferences, regionCountry: iso },
        });
        if (result?.user) {
          await applyLocalUser(result.user);
        }
      } catch {
        // silencioso
      }
    })();
  }, [applyLocalUser, userId, userRegionCountry]);

  return null;
}
