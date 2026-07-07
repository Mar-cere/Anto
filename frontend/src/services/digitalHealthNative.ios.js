/**
 * HealthKit — react-native-health (dev client / EAS build).
 */
import { Platform } from 'react-native';
import AppleHealthKit from 'react-native-health';

const DEFAULT_SYNC_DAYS = 14;
const ASLEEP_VALUES = new Set(['ASLEEP', 'CORE', 'DEEP', 'REM']);

const PERMISSIONS = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.StepCount,
      AppleHealthKit.Constants.Permissions.SleepAnalysis,
      AppleHealthKit.Constants.Permissions.AppleExerciseTime,
    ],
    write: [],
  },
};

let permissionsGranted = false;

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

function probeHealthKitAvailable() {
  return new Promise((resolve) => {
    if (!AppleHealthKit || typeof AppleHealthKit.isAvailable !== 'function') {
      resolve(false);
      return;
    }
    AppleHealthKit.isAvailable((_error, available) => {
      resolve(available === true);
    });
  });
}

function ensurePermissions() {
  return new Promise((resolve) => {
    if (permissionsGranted) {
      resolve(true);
      return;
    }
    AppleHealthKit.initHealthKit(PERMISSIONS, (error) => {
      permissionsGranted = !error;
      resolve(permissionsGranted);
    });
  });
}

function getSteps(start, end) {
  return new Promise((resolve) => {
    AppleHealthKit.getDailyStepCountSamples(
      { startDate: start.toISOString(), endDate: end.toISOString() },
      (error, results) => {
        if (error || !Array.isArray(results) || results.length === 0) {
          resolve(null);
          return;
        }
        const total = results.reduce((sum, row) => sum + Number(row.value || 0), 0);
        resolve(Number.isFinite(total) ? Math.round(total) : null);
      },
    );
  });
}

function getSleepHours(start, end) {
  return new Promise((resolve) => {
    AppleHealthKit.getSleepSamples(
      { startDate: start.toISOString(), endDate: end.toISOString() },
      (error, results) => {
        if (error || !Array.isArray(results) || results.length === 0) {
          resolve(null);
          return;
        }
        const asleep = results.filter((row) => {
          const value = String(row.value || '').toUpperCase();
          return ASLEEP_VALUES.has(value);
        });
        const ms = asleep.reduce((sum, row) => {
          const a = new Date(row.startDate).getTime();
          const b = new Date(row.endDate).getTime();
          return sum + Math.max(0, b - a);
        }, 0);
        resolve(ms > 0 ? Math.round((ms / 3600000) * 10) / 10 : null);
      },
    );
  });
}

function getActiveMinutes(start, end) {
  return new Promise((resolve) => {
    if (typeof AppleHealthKit.getAppleExerciseTime !== 'function') {
      resolve(null);
      return;
    }
    AppleHealthKit.getAppleExerciseTime(
      { startDate: start.toISOString(), endDate: end.toISOString() },
      (error, results) => {
        if (error || !Array.isArray(results) || results.length === 0) {
          resolve(null);
          return;
        }
        const total = results.reduce((sum, row) => sum + Number(row.value || 0), 0);
        resolve(Number.isFinite(total) ? Math.round(total) : null);
      },
    );
  });
}

async function collectDaySnapshot(dayOffset = 0) {
  const { start, end, dayKey } = dayWindow(dayOffset);
  const [steps, sleepHours, activeMinutes] = await Promise.all([
    getSteps(start, end),
    getSleepHours(start, end),
    getActiveMinutes(start, end),
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

/** Solo comprueba si HealthKit está disponible — sin pedir permisos. */
export async function getNativeHealthAvailability() {
  try {
    const available = await probeHealthKitAvailable();
    return { available, platform: Platform.OS };
  } catch {
    return { available: false, platform: Platform.OS };
  }
}

export async function requestNativeHealthPermissions() {
  try {
    const available = await probeHealthKitAvailable();
    if (!available) return false;
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
    const available = await probeHealthKitAvailable();
    if (!available) return [];

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
