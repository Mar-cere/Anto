/**
 * Sincroniza salud digital al volver a primer plano (máx. una vez al día).
 */
import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../context/AuthContext';
import {
  shouldRunDailyForegroundSync,
  syncDigitalHealthWithNative,
} from '../services/digitalHealthSync';
import signalsService from '../services/signalsService';

export default function DigitalHealthForegroundSync() {
  const { user } = useAuth();
  const runningRef = useRef(false);

  useEffect(() => {
    if (!user) return undefined;

    const maybeSync = async () => {
      if (runningRef.current) return;
      try {
        const shouldRun = await shouldRunDailyForegroundSync();
        if (!shouldRun) return;
        const consent = await signalsService.getSignalConsent().catch(() => null);
        if (consent?.digitalHealth?.enabled !== true) return;
        runningRef.current = true;
        await syncDigitalHealthWithNative({ days: 14 });
      } catch {
        // sync silencioso en background
      } finally {
        runningRef.current = false;
      }
    };

    void maybeSync();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void maybeSync();
    });
    return () => sub.remove();
  }, [user]);

  return null;
}
