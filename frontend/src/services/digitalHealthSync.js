/**
 * Orquestación de permisos + sync de salud digital.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collectDigitalHealthSnapshots,
  getDigitalHealthAvailability,
  requestNativeHealthPermissions,
} from './digitalHealthBridge';
import signalsService from './signalsService';

const LAST_SYNC_DAY_KEY = 'digitalHealthLastSyncDay';

export const SYNC_REASON = {
  OK: 'ok',
  UNAVAILABLE: 'unavailable',
  PERMISSIONS_DENIED: 'permissions_denied',
  NO_DATA: 'no_data',
  CONSENT_REQUIRED: 'consent_required',
  SUBSCRIPTION_REQUIRED: 'subscription_required',
  NETWORK: 'network',
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function shouldRunDailyForegroundSync() {
  const last = await AsyncStorage.getItem(LAST_SYNC_DAY_KEY);
  return last !== todayKey();
}

export async function markDailyForegroundSync() {
  await AsyncStorage.setItem(LAST_SYNC_DAY_KEY, todayKey());
}

/**
 * Pide permisos nativos, recoge hasta 14 días y sincroniza con el backend.
 */
export async function syncDigitalHealthWithNative({ days = 14, requireConsent = true } = {}) {
  const availability = await getDigitalHealthAvailability();
  if (!availability.available) {
    return { ok: false, reason: SYNC_REASON.UNAVAILABLE, syncedCount: 0 };
  }

  if (requireConsent) {
    const consent = await signalsService.getSignalConsent().catch(() => null);
    if (consent?.digitalHealth?.enabled !== true) {
      return { ok: false, reason: SYNC_REASON.CONSENT_REQUIRED, syncedCount: 0 };
    }
  }

  const { permissionsGranted, snapshots } = await collectDigitalHealthSnapshots({ days });
  if (!permissionsGranted) {
    return { ok: false, reason: SYNC_REASON.PERMISSIONS_DENIED, syncedCount: 0 };
  }
  if (!snapshots.length) {
    return { ok: false, reason: SYNC_REASON.NO_DATA, syncedCount: 0 };
  }

  try {
    const result = await signalsService.syncDigitalPhenotypeBatch(snapshots);
    if (result.syncedCount > 0) {
      await markDailyForegroundSync();
    }
    return {
      ok: result.syncedCount > 0,
      reason: result.syncedCount > 0 ? SYNC_REASON.OK : SYNC_REASON.NO_DATA,
      syncedCount: result.syncedCount,
      dayKeys: result.dayKeys || [],
    };
  } catch (error) {
    const status = error?.response?.status;
    if (status === 403) {
      return {
        ok: false,
        reason: SYNC_REASON.SUBSCRIPTION_REQUIRED,
        syncedCount: 0,
      };
    }
    return { ok: false, reason: SYNC_REASON.NETWORK, syncedCount: 0 };
  }
}

/**
 * Activa salud digital: permisos primero, luego consentimiento y sync.
 */
export async function enableDigitalHealthFlow() {
  const availability = await getDigitalHealthAvailability();
  if (!availability.available) {
    return { ok: false, reason: SYNC_REASON.UNAVAILABLE };
  }

  const permissionsGranted = await requestNativeHealthPermissions();
  if (!permissionsGranted) {
    return { ok: false, reason: SYNC_REASON.PERMISSIONS_DENIED };
  }

  await signalsService.updateSignalConsent({
    digitalHealth: { enabled: true, steps: true, sleep: true, screenTime: false },
  });

  const sync = await syncDigitalHealthWithNative({ requireConsent: true });
  return {
    ok: sync.ok || sync.reason === SYNC_REASON.NO_DATA,
    reason: sync.reason,
    syncedCount: sync.syncedCount,
  };
}

export default {
  SYNC_REASON,
  syncDigitalHealthWithNative,
  enableDigitalHealthFlow,
  shouldRunDailyForegroundSync,
};
