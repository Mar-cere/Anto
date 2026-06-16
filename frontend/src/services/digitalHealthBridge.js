/**
 * Puente de fenotipado digital (#216).
 * Delega en módulo nativo por plataforma cuando react-native-health / Health Connect están instalados.
 */
import { Platform } from 'react-native';
import {
  getNativeHealthAvailability,
  collectNativeDailySnapshot,
} from './digitalHealthNative';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

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
  buildStubPhenotypeSnapshot,
};
