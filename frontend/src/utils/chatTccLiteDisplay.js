/**
 * Copy y helpers de UI para marco TCC lite in-chat (#201).
 * Progreso inline en burbuja del asistente (no strip fijo).
 */

export const TCC_LITE_STEP_ORDER = [
  'capture_thought',
  'check_evidence',
  'build_alternative',
  'wrap_up',
];

const DEFAULTS_BY_LANG = {
  es: {
    frameLabel: 'Explorando tu pensamiento',
    stepOf: (current, total) => `${current} de ${total}`,
    steps: {
      capture_thought: 'Nombrar la idea',
      check_evidence: 'Revisar hechos',
      build_alternative: 'Otra lectura posible',
      wrap_up: 'Qué te llevas',
    },
  },
  en: {
    frameLabel: 'Working through this thought',
    stepOf: (current, total) => `${current} of ${total}`,
    steps: {
      capture_thought: 'Name the idea',
      check_evidence: 'Check the facts',
      build_alternative: 'Another reading',
      wrap_up: 'What you take away',
    },
  },
};

function resolveLang(language) {
  return String(language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
}

/**
 * @param {object|null|undefined} tccLite metadata.tccLite del mensaje
 * @param {string} language
 * @param {object|null|undefined} translations sección CHAT de i18n
 */
export function resolveTccLiteBubbleDisplay(tccLite, language = 'es', translations = null) {
  if (!tccLite?.step || tccLite.completed === true) return null;

  const stepKey = String(tccLite.step).trim();
  const orderIndex = TCC_LITE_STEP_ORDER.indexOf(stepKey);
  if (orderIndex < 0) return null;

  const lang = resolveLang(language);
  const defaults = DEFAULTS_BY_LANG[lang];
  const stepIndex =
    typeof tccLite.stepIndex === 'number' && tccLite.stepIndex >= 0
      ? tccLite.stepIndex
      : orderIndex;
  const stepTotal = tccLite.stepTotal || TCC_LITE_STEP_ORDER.length;
  const current = stepIndex + 1;

  const stepShortMap = {
    capture_thought: translations?.TCC_LITE_STEP_THOUGHT_SHORT,
    check_evidence: translations?.TCC_LITE_STEP_EVIDENCE_SHORT,
    build_alternative: translations?.TCC_LITE_STEP_ALTERNATIVE_SHORT,
    wrap_up: translations?.TCC_LITE_STEP_WRAP_SHORT,
  };

  const frameLabel =
    tccLite.frameLabel ||
    translations?.TCC_LITE_KICKER ||
    defaults.frameLabel;
  const stepShort =
    tccLite.stepShort ||
    stepShortMap[stepKey] ||
    defaults.steps[stepKey] ||
    defaults.steps.capture_thought;
  const progressLabel =
    translations?.TCC_LITE_STEP_OF?.replace('{current}', String(current)).replace(
      '{total}',
      String(stepTotal),
    ) || defaults.stepOf(current, stepTotal);

  return {
    frameLabel,
    stepShort,
    progressLabel,
    stepIndex,
    stepTotal,
    current,
    distortionLabel: tccLite.distortionLabel || null,
  };
}

export function shouldShowTccLiteBubbleFooter(tccLite) {
  if (!tccLite?.step || tccLite.completed === true) return false;
  return TCC_LITE_STEP_ORDER.includes(String(tccLite.step).trim());
}
