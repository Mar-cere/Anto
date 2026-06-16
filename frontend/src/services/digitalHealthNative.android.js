/**
 * Health Connect — react-native-health-connect + expo-health-connect.
 */
import { Platform } from 'react-native';
import {
  getSdkStatus,
  initialize,
  readRecords,
  requestPermission,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function isHealthConnectReady() {
  try {
    const status = await getSdkStatus();
    return (
      status === SdkAvailabilityStatus.SDK_AVAILABLE ||
      status === SdkAvailabilityStatus.SDK_AVAILABLE_PROVIDER_UPDATE_REQUIRED
    );
  } catch {
    return false;
  }
}

async function ensureSession() {
  const ready = await isHealthConnectReady();
  if (!ready) return false;
  try {
    return (await initialize()) === true;
  } catch {
    return false;
  }
}

async function ensurePermissions() {
  const ok = await ensureSession();
  if (!ok) return false;
  try {
    const granted = await requestPermission([
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'SleepSession' },
      { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
    ]);
    return Array.isArray(granted) && granted.length > 0;
  } catch {
    return false;
  }
}

async function readSteps(start, end) {
  try {
    const result = await readRecords('Steps', {
      timeRangeFilter: {
        operator: 'between',
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      },
    });
    const records = result?.records || [];
    const total = records.reduce((sum, row) => sum + Number(row.count || 0), 0);
    return Number.isFinite(total) ? Math.round(total) : null;
  } catch {
    return null;
  }
}

async function readSleepHours(start, end) {
  try {
    const result = await readRecords('SleepSession', {
      timeRangeFilter: {
        operator: 'between',
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      },
    });
    const records = result?.records || [];
    const ms = records.reduce((sum, row) => {
      const a = new Date(row.startTime).getTime();
      const b = new Date(row.endTime).getTime();
      return sum + Math.max(0, b - a);
    }, 0);
    return ms > 0 ? Math.round((ms / 3600000) * 10) / 10 : null;
  } catch {
    return null;
  }
}

export async function getNativeHealthAvailability() {
  try {
    const ready = await isHealthConnectReady();
    return { available: ready, platform: Platform.OS };
  } catch {
    return { available: false, platform: Platform.OS };
  }
}

export async function collectNativeDailySnapshot() {
  try {
    const granted = await ensurePermissions();
    if (!granted) return null;

    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const [steps, sleepHours] = await Promise.all([
      readSteps(start, end),
      readSleepHours(start, end),
    ]);

    if (steps == null && sleepHours == null) return null;

    return {
      dayKey: todayKey(),
      steps,
      sleepHours,
      screenTimeMinutes: null,
      socialScreenRatio: null,
      activeMinutes: null,
      inactivityHours: null,
      source: 'manual',
    };
  } catch {
    return null;
  }
}

export default {
  getNativeHealthAvailability,
  collectNativeDailySnapshot,
};
