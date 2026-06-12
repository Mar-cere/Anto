/**
 * Marco TCC lite in-chat (#201 MVP): guiar pensamiento → evidencia → alternativa en el hilo.
 */
import { getAutomaticThoughtDistortionLabel } from '../constants/automaticThoughtDistortionPicker.js';
import { CONTEXT_INFERENCE_THRESHOLDS } from '../constants/openai.js';
import { buildAtPrefillParams } from './atRecordPrefillService.js';
import { sliceActiveSessionMessages } from './sessionInsightService.js';
import { normalizeApiLanguage } from '../utils/apiLanguage.js';
import { tccLiteCopy, tccLiteStepIndex, tccLiteStepOrder } from '../utils/tccLiteCopy.js';

const MIN_USER_CHARS_TO_ADVANCE = 8;
const MIN_INTENSITY_ACTIVATE = 5;
const EXIT_PATTERN =
  /\b(no quiero|mejor no|para|detente|stop|basta|solo quiero hablar|dej[aá]lo|cancela)\b/i;

const EXPLICIT_TCC_PATTERN =
  /reestructur|pensamiento\s+autom|distorsi|catastrof|todo\s+o\s+nada|evidencia|creencia|patr[oó]n\s+de\s+pensamiento|thought\s+record|cognitive|reframe/i;

function stripControlChars(text) {
  return String(text || '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim();
}

function isHighRisk(riskLevel) {
  const r = String(riskLevel || '').trim().toUpperCase();
  return r === 'HIGH' || r === 'CRITICAL';
}

export function readPersistedTccLiteState(persistedState) {
  if (!persistedState || typeof persistedState !== 'object') return null;
  const step = String(persistedState.step || '').trim();
  if (!tccLiteStepOrder().includes(step)) return null;
  if (persistedState.completed === true) return null;
  return {
    step,
    distortionType: persistedState.distortionType
      ? String(persistedState.distortionType).trim()
      : null,
    completed: false,
  };
}

export function readLastTccLiteFromHistory(conversationHistory) {
  const list = Array.isArray(conversationHistory) ? conversationHistory : [];
  for (let i = 0; i < list.length; i += 1) {
    const msg = list[i];
    if (msg?.role !== 'assistant') continue;
    const lite = msg?.metadata?.tccLite;
    if (!lite?.step) continue;
    const step = String(lite.step).trim();
    if (!tccLiteStepOrder().includes(step)) continue;
    return {
      step,
      distortionType: lite.distortionType ? String(lite.distortionType).trim() : null,
      completed: lite.completed === true,
    };
  }
  return null;
}

function resolveDistortionType(contextualAnalysis) {
  const type = contextualAnalysis?.primaryDistortion?.type;
  return type ? String(type).trim().toLowerCase() : null;
}

function shouldActivateTccLite({
  contextualAnalysis,
  emotionalAnalysis,
  userContent,
  conversationHistory,
  riskLevel,
  sessionIntention,
}) {
  if (isHighRisk(riskLevel)) return false;

  const text = stripControlChars(userContent);
  if (!text || EXIT_PATTERN.test(text)) return false;

  const previous = readLastTccLiteFromHistory(conversationHistory);
  if (previous && !previous.completed) return true;

  const intensity = Number(emotionalAnalysis?.intensity) || 0;
  const primary = contextualAnalysis?.primaryDistortion;
  const confidence = Number(primary?.confidence) || 0;
  const minConf = CONTEXT_INFERENCE_THRESHOLDS.DISTORTION_CONFIDENCE_MIN;

  if (primary?.type && confidence >= minConf && intensity >= MIN_INTENSITY_ACTIVATE) {
    return true;
  }

  if (EXPLICIT_TCC_PATTERN.test(text) && intensity >= 4) {
    return true;
  }

  if (sessionIntention === 'technique' && primary?.type && confidence >= minConf * 0.85) {
    return true;
  }

  return false;
}

function resolveStepForTurn({ previousStep, userContent }) {
  const text = stripControlChars(userContent);
  if (!previousStep) return 'capture_thought';
  if (text.length < MIN_USER_CHARS_TO_ADVANCE) return previousStep;

  switch (previousStep) {
    case 'capture_thought':
      return 'check_evidence';
    case 'check_evidence':
      return 'build_alternative';
    case 'build_alternative':
      return 'wrap_up';
    case 'wrap_up':
      return null;
    default:
      return 'capture_thought';
  }
}

function collectTccLiteUserTexts(conversationHistory) {
  const session = sliceActiveSessionMessages(conversationHistory || []);
  return session
    .filter((m) => m?.role === 'user')
    .map((m) => stripControlChars(m.content))
    .filter(Boolean);
}

/**
 * Extrae prefill AT desde mensajes de la sesión TCC lite.
 */
export function buildAtHandoffFromTccLiteSession({
  conversationHistory,
  distortionType,
  language = 'es',
}) {
  const userTexts = collectTccLiteUserTexts(conversationHistory);
  if (userTexts.length === 0) return null;

  const combined = userTexts.join(' ').slice(0, 2000);
  const fromCombined = buildAtPrefillParams(combined, language) || {};

  const params = { ...fromCombined, fromTccLite: true };
  const dtype = String(distortionType || fromCombined.prefillDistortionType || '').trim().toLowerCase();
  if (dtype) {
    params.prefillDistortionType = dtype;
    params.prefillDistortionName =
      getAutomaticThoughtDistortionLabel(dtype, language) ||
      params.prefillDistortionName ||
      '';
  }

  if (userTexts.length >= 2 && !params.prefillAutomaticThought) {
    params.prefillAutomaticThought = truncate(userTexts[0], 500);
    if (!params.prefillSituation && userTexts.length > 1) {
      params.prefillSituation = truncate(userTexts[1], 500);
    }
  }
  if (userTexts.length >= 3 && !params.prefillBalancedThought) {
    params.prefillBalancedThought = truncate(userTexts[userTexts.length - 1], 500);
  }

  if (!params.prefillAutomaticThought && !params.prefillSituation) return null;
  return {
    screen: 'AutomaticThoughtRecord',
    params,
  };
}

function truncate(text, max = 100) {
  const t = String(text || '').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

function buildPromptSnippet({ step, distortionType, language }) {
  const lang = normalizeApiLanguage(language);
  const copy = tccLiteCopy(lang);
  const template = copy.prompts[step];
  if (!template) return '';

  const distortionLabel =
    getAutomaticThoughtDistortionLabel(distortionType, lang) ||
    (distortionType ? distortionType.replace(/_/g, ' ') : lang === 'en' ? 'rigid thinking' : 'pensamiento rígido');

  const body = template.replace(/\{distortionLabel\}/g, distortionLabel);
  return `\n\n### ${copy.kicker} (interno — prioridad alta)\n${copy.disclaimer}\n\n${body}\n`;
}

/**
 * @returns {{
 *   active: boolean,
 *   step: string|null,
 *   stepIndex: number,
 *   stepTotal: number,
 *   distortionType: string|null,
 *   distortionLabel: string|null,
 *   promptSnippet: string|null,
 *   completed: boolean,
 * }}
 */
export function planChatTccLite({
  userContent,
  contextualAnalysis,
  emotionalAnalysis,
  conversationHistory,
  riskLevel,
  sessionIntention,
  language = 'es',
  resumeFromInsight = null,
  persistedState = null,
}) {
  const inactive = {
    active: false,
    step: null,
    stepIndex: 0,
    stepTotal: tccLiteStepOrder().length,
    distortionType: null,
    distortionLabel: null,
    promptSnippet: null,
    completed: false,
    atHandoff: null,
  };

  const text = stripControlChars(userContent);
  if (!text) return inactive;
  if (EXIT_PATTERN.test(text)) return inactive;

  const previous =
    readLastTccLiteFromHistory(conversationHistory) ||
    readPersistedTccLiteState(persistedState);
  const resumeType = String(resumeFromInsight?.distortionType || '').trim().toLowerCase();

  if (resumeType && !previous) {
    const lang = normalizeApiLanguage(language);
    const distortionLabel =
      String(resumeFromInsight?.distortionLabel || '').trim() ||
      getAutomaticThoughtDistortionLabel(resumeType, lang) ||
      null;
    return {
      active: true,
      step: 'capture_thought',
      stepIndex: tccLiteStepIndex('capture_thought'),
      stepTotal: tccLiteStepOrder().length,
      distortionType: resumeType,
      distortionLabel,
      promptSnippet: buildPromptSnippet({
        step: 'capture_thought',
        distortionType: resumeType,
        language: lang,
      }),
      completed: false,
      atHandoff: null,
      resumedFromInsight: true,
    };
  }

  const continuing = previous && !previous.completed;

  if (!continuing && !shouldActivateTccLite({
    contextualAnalysis,
    emotionalAnalysis,
    userContent: text,
    conversationHistory,
    riskLevel,
    sessionIntention,
  })) {
    return inactive;
  }

  const distortionType =
    resolveDistortionType(contextualAnalysis) || previous?.distortionType || resumeType || null;

  const step = continuing
    ? resolveStepForTurn({ previousStep: previous.step, userContent: text })
    : 'capture_thought';

  if (!step) {
    const lang = normalizeApiLanguage(language);
    const atHandoff = buildAtHandoffFromTccLiteSession({
      conversationHistory: [
        ...(conversationHistory || []),
        { role: 'user', content: text, createdAt: new Date() },
      ],
      distortionType: previous?.distortionType || distortionType,
      language: lang,
    });
    return { ...inactive, completed: true, atHandoff };
  }

  const lang = normalizeApiLanguage(language);
  const distortionLabel = distortionType
    ? getAutomaticThoughtDistortionLabel(distortionType, lang) || null
    : null;

  const atHandoff =
    step === 'wrap_up'
      ? buildAtHandoffFromTccLiteSession({
          conversationHistory: [
            ...(conversationHistory || []),
            { role: 'user', content: text },
          ],
          distortionType,
          language: lang,
        })
      : null;

  return {
    active: true,
    step,
    stepIndex: tccLiteStepIndex(step),
    stepTotal: tccLiteStepOrder().length,
    distortionType,
    distortionLabel,
    promptSnippet: buildPromptSnippet({ step, distortionType, language: lang }),
    completed: false,
    atHandoff,
  };
}

export function attachTccLiteToAssistantMetadata(metadata, tccLitePlan) {
  if (!metadata || !tccLitePlan?.active || !tccLitePlan?.step) return metadata;
  return {
    ...metadata,
    tccLite: {
      step: tccLitePlan.step,
      distortionType: tccLitePlan.distortionType || null,
      completed: tccLitePlan.completed === true,
    },
  };
}

export function toTccLiteClientPayload(tccLitePlan, language = 'es') {
  if (!tccLitePlan?.active || !tccLitePlan?.step) {
    return {
      active: false,
      completed: tccLitePlan?.completed === true,
      atHandoff: tccLitePlan?.atHandoff || null,
    };
  }
  const lang = normalizeApiLanguage(language);
  const copy = tccLiteCopy(lang);
  const stepCopy = copy.steps[tccLitePlan.step] || copy.steps.capture_thought;
  return {
    active: true,
    completed: tccLitePlan.completed === true,
    step: tccLitePlan.step,
    stepIndex: tccLitePlan.stepIndex,
    stepTotal: tccLitePlan.stepTotal,
    stepLabel: stepCopy.label,
    stepShort: stepCopy.short,
    kicker: copy.kicker,
    distortionType: tccLitePlan.distortionType,
    distortionLabel: tccLitePlan.distortionLabel,
    atHandoff: tccLitePlan.atHandoff || null,
    resumedFromInsight: tccLitePlan.resumedFromInsight === true,
  };
}

export default {
  planChatTccLite,
  attachTccLiteToAssistantMetadata,
  toTccLiteClientPayload,
  readLastTccLiteFromHistory,
  readPersistedTccLiteState,
  buildAtHandoffFromTccLiteSession,
};
