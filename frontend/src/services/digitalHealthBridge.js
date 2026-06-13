/**
 * Puente de fenotipado digital (#216).
 * MVP: interfaz lista para HealthKit / Health Connect; sync manual/stub hasta módulo nativo.
 */
import { Platform } from 'react-native';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * @returns {Promise<{ available: boolean, platform: string }>}
 */
export async function getDigitalHealthAvailability() {
  // Punto de extensión: react-native-health / Health Connect en dev client.
  return { available: false, platform: Platform.OS };
}

/**
 * @returns {Promise<object|null>} snapshot diario agregado
 */
export async function collectDailyPhenotypeSnapshot() {
  const availability = await getDigitalHealthAvailability();
  if (!availability.available) return null;

  // Reservado para integración nativa.
  return null;
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
    inactivityHours: overrides.inactivityHours ?? null,
    source: 'stub',
  };
}

export default {
  getDigitalHealthAvailability,
  collectDailyPhenotypeSnapshot,
  buildStubPhenotypeSnapshot,
};
