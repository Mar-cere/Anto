/**
 * HealthKit — react-native-health (dev client / EAS build).
 */
import { Platform } from 'react-native';
import AppleHealthKit from 'react-native-health';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

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
          return value.includes('ASLEEP') || value === 'INBED';
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

/** Solo comprueba si HealthKit está disponible — sin pedir permisos. */
export async function getNativeHealthAvailability() {
  try {
    const available = await probeHealthKitAvailable();
    return { available, platform: Platform.OS };
  } catch {
    return { available: false, platform: Platform.OS };
  }
}

export async function collectNativeDailySnapshot() {
  try {
    const available = await probeHealthKitAvailable();
    if (!available) return null;

    const granted = await ensurePermissions();
    if (!granted) return null;

    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const [steps, sleepHours, activeMinutes] = await Promise.all([
      getSteps(start, end),
      getSleepHours(start, end),
      getActiveMinutes(start, end),
    ]);

    if (steps == null && sleepHours == null && activeMinutes == null) return null;

    return {
      dayKey: todayKey(),
      steps,
      sleepHours,
      screenTimeMinutes: null,
      socialScreenRatio: null,
      activeMinutes,
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
