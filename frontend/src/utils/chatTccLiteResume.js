/**
 * Payload pendiente para retomar marco TCC lite desde insight de sesión.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'chatTccLiteResumePending';

export async function setPendingTccLiteResume(payload) {
  if (!payload?.distortionType) {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return;
  }
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      distortionType: String(payload.distortionType).trim(),
      distortionLabel: String(payload.distortionLabel || '').trim(),
      step: 'capture_thought',
      savedAt: new Date().toISOString(),
    }),
  );
}

export async function consumePendingTccLiteResume() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    await AsyncStorage.removeItem(STORAGE_KEY);
    const parsed = JSON.parse(raw);
    if (!parsed?.distortionType) return null;
    return parsed;
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    return null;
  }
}

export async function peekPendingTccLiteResume() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.distortionType ? parsed : null;
  } catch {
    return null;
  }
}

export function buildTccLiteUiFromResume(resume) {
  if (!resume?.distortionType) return null;
  return {
    active: true,
    completed: false,
    step: 'capture_thought',
    stepIndex: 0,
    stepTotal: 4,
    stepLabel: resume.stepLabel || 'Pensamiento',
    stepShort: resume.stepShort || '',
    kicker: resume.kicker || 'Marco TCC',
    distortionType: resume.distortionType,
    distortionLabel: resume.distortionLabel || null,
    fromInsight: true,
  };
}
