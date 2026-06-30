/**
 * Estado y salida del protocolo de crisis v1 (#93, §4).
 */
import {
  buildCrisisActionDecision,
  hasExplicitSuicidalOrSelfHarmLexicon,
} from '../constants/crisis.js';
import metricsService from './metricsService.js';

export const PROTOCOL_VERSION = '1.0';
const STABLE_RISK_LEVELS = new Set(['LOW', 'WARNING']);
const STABLE_TURNS_REQUIRED = 2;

const ADDICTION_CRISIS_LEXICON =
  /\b(sobredosis|overdose|no\s+puedo\s+parar|can(?:'|no)t\s+stop|reca(?:er|í|eré)|relapse|voy\s+a\s+recaer|miedo\s+a\s+recaer|afraid\s+(?:of|to)\s+relapse|necesito\s+(?:una\s+)?dosis|need\s+(?:a\s+)?(?:hit|fix|dose))\b/i;

const USER_EXPLICIT_OK =
  /(?:estoy\s+bien|me\s+siento\s+bien|ya\s+estoy\s+(?:bien|a\s+salvo|mejor|tranquil[oa])|estoy\s+a\s+salvo|me\s+siento\s+(?:mejor|a\s+salvo|tranquil[oa])|ya\s+me\s+siento\s+mejor|i\s*'?m\s+(?:ok|okay|fine|safe|better)|i\s+feel\s+(?:ok|okay|better|safe)|feeling\s+(?:ok|okay|better|safe))/i;

export function hasAddictionCrisisLexicon(content) {
  if (!content || typeof content !== 'string') return false;
  return ADDICTION_CRISIS_LEXICON.test(content);
}

export function hasCrisisBatterySignal(messageContent, crisisDecision = null) {
  if (hasExplicitSuicidalOrSelfHarmLexicon(messageContent)) return true;
  if (hasAddictionCrisisLexicon(messageContent)) return true;
  if ((crisisDecision?.evidence?.criticalSignals ?? 0) >= 1) return true;
  return false;
}

export function isUserExplicitWellbeingMessage(content) {
  if (!content || typeof content !== 'string') return false;
  return USER_EXPLICIT_OK.test(content.trim());
}

function normalizeRiskLevel(riskLevel) {
  return String(riskLevel || 'LOW').trim().toUpperCase();
}

export function shouldActivateCrisisProtocol({
  riskLevel,
  hardStop = false,
  messageContent = '',
  crisisDecision = null,
  isCrisis = false,
} = {}) {
  if (hardStop === true) return true;
  const level = normalizeRiskLevel(riskLevel);
  if (level === 'MEDIUM' || level === 'HIGH') return true;
  if (level === 'WARNING' && (isCrisis || hasCrisisBatterySignal(messageContent, crisisDecision))) {
    return true;
  }
  return false;
}

function defaultProtocolState() {
  return {
    active: false,
    stableUserTurns: 0,
    hadContactAlert: false,
    protocolVersion: PROTOCOL_VERSION,
    enteredAt: null,
  };
}

export function normalizeCrisisProtocolState(raw) {
  if (!raw || typeof raw !== 'object') return defaultProtocolState();
  return {
    active: raw.active === true,
    stableUserTurns: Math.max(0, Number(raw.stableUserTurns) || 0),
    hadContactAlert: raw.hadContactAlert === true,
    protocolVersion: String(raw.protocolVersion || PROTOCOL_VERSION).slice(0, 16),
    enteredAt: raw.enteredAt || null,
  };
}

/**
 * Avanza el estado del protocolo tras un turno del usuario.
 * @returns {{ nextState: object, exit: object|null }}
 */
export function advanceCrisisProtocolState(
  previousState,
  {
    riskLevel,
    userContent = '',
    crisisDecision = null,
    hardStop = false,
    isCrisis = false,
    hadContactAlert = false,
  } = {},
) {
  const prev = normalizeCrisisProtocolState(previousState);
  const entering = shouldActivateCrisisProtocol({
    riskLevel,
    hardStop,
    messageContent: userContent,
    crisisDecision,
    isCrisis,
  });

  if (!prev.active && !entering) {
    return { nextState: prev, exit: null };
  }

  if (!prev.active && entering) {
    return {
      nextState: {
        active: true,
        stableUserTurns: 0,
        hadContactAlert: hadContactAlert === true,
        protocolVersion: PROTOCOL_VERSION,
        enteredAt: new Date(),
      },
      exit: null,
    };
  }

  const level = normalizeRiskLevel(riskLevel);
  const battery = hasCrisisBatterySignal(userContent, crisisDecision);
  const explicitOk = isUserExplicitWellbeingMessage(userContent);
  const stableThisTurn = STABLE_RISK_LEVELS.has(level) && !battery;
  const stableUserTurns = battery ? 0 : prev.stableUserTurns + (stableThisTurn ? 1 : 0);
  const hadAlert = prev.hadContactAlert || hadContactAlert === true;
  const metersStable = stableUserTurns >= STABLE_TURNS_REQUIRED;

  if (metersStable || explicitOk) {
    const reason =
      metersStable && explicitOk
        ? 'both'
        : metersStable
          ? 'meters_stable_2_turns'
          : 'user_explicit_ok';
    return {
      nextState: defaultProtocolState(),
      exit: {
        reason,
        riskLevelAtExit: level,
        hadContactAlert: hadAlert,
        protocolVersion: PROTOCOL_VERSION,
      },
    };
  }

  return {
    nextState: {
      active: true,
      stableUserTurns,
      hadContactAlert: hadAlert,
      protocolVersion: PROTOCOL_VERSION,
      enteredAt: prev.enteredAt || new Date(),
    },
    exit: null,
  };
}

export async function recordCrisisProtocolExit(userId, conversationId, exitPayload) {
  if (!exitPayload) return;
  await metricsService
    .recordMetric(
      'crisis_protocol_exit',
      {
        reason: exitPayload.reason,
        riskLevelAtExit: exitPayload.riskLevelAtExit,
        hadContactAlert: exitPayload.hadContactAlert === true,
        protocolVersion: exitPayload.protocolVersion || PROTOCOL_VERSION,
      },
      userId != null ? String(userId) : null,
      conversationId != null ? { conversationId: String(conversationId) } : {},
    )
    .catch(() => {});
}

/**
 * Orquesta decisión + avance de protocolo en un turno de chat.
 */
export function evaluateCrisisProtocolTurn({
  previousState,
  riskLevel,
  messageContent,
  contextualAnalysis,
  trendAnalysis,
  crisisHistory,
  conversationContext,
  hardStop = false,
  isCrisis = false,
  hadContactAlert = false,
}) {
  const crisisDecision = buildCrisisActionDecision({
    riskLevel,
    messageContent,
    contextualAnalysis,
    trendAnalysis,
    crisisHistory,
    conversationContext,
  });
  const { nextState, exit } = advanceCrisisProtocolState(previousState, {
    riskLevel,
    userContent: messageContent,
    crisisDecision,
    hardStop,
    isCrisis,
    hadContactAlert,
  });
  return { crisisDecision, crisisProtocolState: nextState, crisisProtocolExit: exit };
}

export default {
  PROTOCOL_VERSION,
  hasCrisisBatterySignal,
  isUserExplicitWellbeingMessage,
  shouldActivateCrisisProtocol,
  advanceCrisisProtocolState,
  recordCrisisProtocolExit,
  evaluateCrisisProtocolTurn,
};
