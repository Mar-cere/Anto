/**
 * Stub web / plataformas sin módulo nativo.
 */
import { Platform } from 'react-native';

export async function getNativeHealthAvailability() {
  return { available: false, platform: Platform.OS };
}

export async function collectNativeDailySnapshot() {
  return null;
}

export default {
  getNativeHealthAvailability,
  collectNativeDailySnapshot,
};
