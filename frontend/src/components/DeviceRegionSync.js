/**
 * Persiste regionCountry (ISO desde locale del dispositivo) al iniciar sesión, sin GPS.
 * Complementa timezone en useSettingsScreen; corre en toda la app autenticada.
 */
import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { inferDeviceRegionCountry } from '../utils/deviceRegion';

const STORAGE_USER_DATA = 'userData';

export default function DeviceRegionSync() {
  const { user, refreshSession } = useAuth();
  const syncedRef = useRef(false);
  const userId = user?._id ?? user?.id;

  useEffect(() => {
    syncedRef.current = false;
  }, [userId]);

  useEffect(() => {
    if (!user || syncedRef.current) return;

    const currentRegion = user?.preferences?.regionCountry;
    if (currentRegion != null && String(currentRegion).trim()) {
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
        const currentPreferences = user?.preferences || {};
        const result = await api.put(ENDPOINTS.UPDATE_PROFILE, {
          preferences: { ...currentPreferences, regionCountry: iso },
        });
        if (result?.user) {
          await AsyncStorage.setItem(STORAGE_USER_DATA, JSON.stringify(result.user));
          await refreshSession();
        }
      } catch {
        // silencioso
      }
    })();
  }, [refreshSession, user, userId]);

  return null;
}
