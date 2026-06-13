/**
 * Payload pendiente para retomar marco TCC lite desde insight de sesión.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'chatTccLiteResumePending';

const TCC_LITE_STEPS = ['capture_thought', 'check_evidence', 'build_alternative', 'wrap_up'];

const STEP_UI_ES = {
  capture_thought: { label: 'Pensamiento', short: 'Nombrar la idea' },
  check_evidence: { label: 'Evidencia', short: 'Revisar hechos' },
  build_alternative: { label: 'Alternativa', short: 'Otra lectura posible' },
  wrap_up: { label: 'Cierre', short: 'Qué te llevas' },
};

const STEP_UI_EN = {
  capture_thought: { label: 'Thought', short: 'Name the idea' },
  check_evidence: { label: 'Evidence', short: 'Check the facts' },
  build_alternative: { label: 'Alternative', short: 'Another reading' },
  wrap_up: { label: 'Wrap-up', short: 'What you take away' },
};

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

export async function clearPendingTccLiteResume() {
  await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
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

export function buildTccLiteUiFromResume(resume, language = 'es') {
  if (!resume?.distortionType) return null;
  return buildTccLiteUiFromPersistedStep(
    {
      step: resume.step || 'capture_thought',
      distortionType: resume.distortionType,
      distortionLabel: resume.distortionLabel,
      stepLabel: resume.stepLabel,
      stepShort: resume.stepShort,
      kicker: resume.kicker,
    },
    language,
    { fromInsight: true },
  );
}

/**
 * Restaura strip TCC desde metadata de mensajes o estado del servidor.
 */
export function buildTccLiteUiFromPersistedStep(lite, language = 'es', extras = {}) {
  if (!lite?.step) return null;
  const lang = String(language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
  const stepIndex = Math.max(0, TCC_LITE_STEPS.indexOf(lite.step));
  const copy = lang === 'en' ? STEP_UI_EN : STEP_UI_ES;
  const stepCopy = copy[lite.step] || copy.capture_thought;
  return {
    active: true,
    completed: false,
    step: lite.step,
    stepIndex,
    stepTotal: TCC_LITE_STEPS.length,
    stepLabel: lite.stepLabel || stepCopy.label,
    stepShort: lite.stepShort || stepCopy.short,
    kicker: lite.kicker || (lang === 'en' ? 'Working through this thought' : 'Explorando tu pensamiento'),
    distortionType: lite.distortionType || null,
    distortionLabel: lite.distortionLabel || null,
    ...extras,
  };
}
