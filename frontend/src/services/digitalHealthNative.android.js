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

const DEFAULT_SYNC_DAYS = 14;

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function dayWindow(dayOffset = 0) {
  const end = new Date();
  end.setDate(end.getDate() - dayOffset);
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setHours(0, 0, 0, 0);
  return { start, end, dayKey: todayKey(start) };
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
      { accessType: 'read', recordType: 'ExerciseSession' },
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

async function readActiveMinutes(start, end) {
  try {
    const result = await readRecords('ExerciseSession', {
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
    if (ms > 0) return Math.round(ms / 60000);
  } catch {
    // fallback a calorías activas
  }

  try {
    const result = await readRecords('ActiveCaloriesBurned', {
      timeRangeFilter: {
        operator: 'between',
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      },
    });
    const records = result?.records || [];
    const kcal = records.reduce((sum, row) => {
      const energy = row.energy?.inKilocalories ?? row.energy ?? row.activeCalories ?? 0;
      return sum + Number(energy || 0);
    }, 0);
    if (!Number.isFinite(kcal) || kcal <= 0) return null;
    return Math.min(1440, Math.round(kcal / 5));
  } catch {
    return null;
  }
}

async function collectDaySnapshot(dayOffset = 0) {
  const { start, end, dayKey } = dayWindow(dayOffset);
  const [steps, sleepHours, activeMinutes] = await Promise.all([
    readSteps(start, end),
    readSleepHours(start, end),
    readActiveMinutes(start, end),
  ]);
  if (steps == null && sleepHours == null && activeMinutes == null) return null;
  return {
    dayKey,
    steps,
    sleepHours,
    screenTimeMinutes: null,
    socialScreenRatio: null,
    activeMinutes,
    inactivityHours: null,
  };
}

export async function getNativeHealthAvailability() {
  try {
    const ready = await isHealthConnectReady();
    return { available: ready, platform: Platform.OS };
  } catch {
    return { available: false, platform: Platform.OS };
  }
}

export async function requestNativeHealthPermissions() {
  try {
    return ensurePermissions();
  } catch {
    return false;
  }
}

export async function collectNativeDailySnapshot() {
  const snapshots = await collectNativeDailySnapshots({ days: 1 });
  return snapshots[0] || null;
}

export async function collectNativeDailySnapshots({ days = DEFAULT_SYNC_DAYS } = {}) {
  try {
    const granted = await ensurePermissions();
    if (!granted) return [];

    const safeDays = Math.max(1, Math.min(Number(days) || 1, DEFAULT_SYNC_DAYS));
    const snapshots = [];
    for (let offset = 0; offset < safeDays; offset += 1) {
      const row = await collectDaySnapshot(offset);
      if (row) snapshots.push(row);
    }
    return snapshots;
  } catch {
    return [];
  }
}

export default {
  getNativeHealthAvailability,
  requestNativeHealthPermissions,
  collectNativeDailySnapshot,
  collectNativeDailySnapshots,
};
