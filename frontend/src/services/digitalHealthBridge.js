/**
 * Puente de fenotipado digital (#216).
 */
import { Platform } from 'react-native';
import {
  collectNativeDailySnapshot,
  collectNativeDailySnapshots,
  getNativeHealthAvailability,
  requestNativeHealthPermissions,
} from './digitalHealthNative';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export { requestNativeHealthPermissions, collectNativeDailySnapshots };

/**
 * @returns {Promise<{ available: boolean, platform: string }>}
 */
export async function getDigitalHealthAvailability() {
  const native = await getNativeHealthAvailability();
  if (native?.available) return native;
  return { available: false, platform: Platform.OS };
}

/**
 * @returns {Promise<object|null>} snapshot diario agregado
 */
export async function collectDailyPhenotypeSnapshot() {
  const availability = await getDigitalHealthAvailability();
  if (!availability.available) return null;
  return collectNativeDailySnapshot();
}

/**
 * Solicita permisos nativos y recoge snapshots de los últimos días.
 * @returns {Promise<{ permissionsGranted: boolean, snapshots: object[] }>}
 */
export async function collectDigitalHealthSnapshots({ days = 14 } = {}) {
  const availability = await getDigitalHealthAvailability();
  if (!availability.available) {
    return { permissionsGranted: false, snapshots: [] };
  }
  const permissionsGranted = await requestNativeHealthPermissions();
  if (!permissionsGranted) {
    return { permissionsGranted: false, snapshots: [] };
  }
  const snapshots = await collectNativeDailySnapshots({ days });
  return { permissionsGranted: true, snapshots };
}

/**
 * Payload demo/stub para pruebas internas (no enviar en prod sin consentimiento).
 */
export function buildStubPhenotypeSnapshot(overrides = {}) {
  return {
    dayKey: todayKey(),
    steps: overrides.steps ?? null,
    sleepHours: overrides.sleepHours ?? null,
    screenTimeMinutes: overrides.screenTimeMinutes ?? null,
    socialScreenRatio: overrides.socialScreenRatio ?? null,
    activeMinutes: overrides.activeMinutes ?? null,
    inactivityHours: overrides.inactivityHours ?? null,
    source: 'stub',
  };
}

export default {
  getDigitalHealthAvailability,
  collectDailyPhenotypeSnapshot,
  collectDigitalHealthSnapshots,
  requestNativeHealthPermissions,
  collectNativeDailySnapshots,
  buildStubPhenotypeSnapshot,
};
