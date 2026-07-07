/**
 * Stub web / plataformas sin módulo nativo.
 */
import { Platform } from 'react-native';

export async function getNativeHealthAvailability() {
  return { available: false, platform: Platform.OS };
}

export async function requestNativeHealthPermissions() {
  return false;
}

export async function collectNativeDailySnapshot() {
  return null;
}

export async function collectNativeDailySnapshots() {
  return [];
}

export default {
  getNativeHealthAvailability,
  requestNativeHealthPermissions,
  collectNativeDailySnapshot,
  collectNativeDailySnapshots,
};
