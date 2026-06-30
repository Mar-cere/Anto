/**
 * Check-in de crisis suave (#19): regulación breve sin protocolo #93.
 */
import { buildSoftCrisisCheckInClientPayload, SOFT_CHECK_IN_VERSION } from '../constants/softCrisisCheckInCopy.js';
import { resolveCrisisEmergencySource } from '../constants/crisis.js';
import {
  hasCrisisBatterySignal,
  isUserExplicitWellbeingMessage,
  shouldActivateCrisisProtocol,
} from './crisisProtocolService.js';

const STABLE_RISK_LEVELS = new Set(['LOW', 'WARNING']);
const STABLE_TURNS_REQUIRED = 2;

function normalizeRiskLevel(riskLevel) {
  return String(riskLevel || 'LOW').trim().toUpperCase();
}

function defaultSoftCheckInState() {
  return {
    active: false,
    stableUserTurns: 0,
    dismissed: false,
    version: SOFT_CHECK_IN_VERSION,
    enteredAt: null,
  };
}

export function normalizeSoftCrisisCheckInState(raw) {
  if (!raw || typeof raw !== 'object') return defaultSoftCheckInState();
  return {
    active: raw.active === true,
    stableUserTurns: Math.max(0, Number(raw.stableUserTurns) || 0),
    dismissed: raw.dismissed === true,
    version: String(raw.version || SOFT_CHECK_IN_VERSION).slice(0, 16),
    enteredAt: raw.enteredAt || null,
  };
}

/**
 * Malestar WARNING sin batería ni hard-stop: candidato a check-in suave.
 */
export function shouldOfferSoftCrisisCheckIn({
  riskLevel,
  hardStop = false,
  messageContent = '',
  crisisDecision = null,
  crisisProtocolActive = false,
} = {}) {
  if (hardStop === true) return false;
  if (crisisProtocolActive === true) return false;
  if (normalizeRiskLevel(riskLevel) !== 'WARNING') return false;
  if (hasCrisisBatterySignal(messageContent, crisisDecision)) return false;
  if (
    shouldActivateCrisisProtocol({
      riskLevel,
      hardStop,
      messageContent,
      crisisDecision,
    })
  ) {
    return false;
  }
  return true;
}

/**
 * Avanza el estado del check-in suave tras un turno del usuario.
 * @returns {{ nextState: object, exit: object|null }}
 */
export function advanceSoftCrisisCheckInState(
  previousState,
  {
    riskLevel,
    userContent = '',
    crisisDecision = null,
    hardStop = false,
    crisisProtocolEntering = false,
  } = {},
) {
  const prev = normalizeSoftCrisisCheckInState(previousState);
  const entering = shouldOfferSoftCrisisCheckIn({
    riskLevel,
    hardStop,
    messageContent: userContent,
    crisisDecision,
    crisisProtocolActive: crisisProtocolEntering,
  });

  if (crisisProtocolEntering) {
    if (!prev.active) return { nextState: prev, exit: null };
    return {
      nextState: defaultSoftCheckInState(),
      exit: { reason: 'escalated_to_protocol', riskLevelAtExit: normalizeRiskLevel(riskLevel) },
    };
  }

  if (!prev.active && !entering) {
    return { nextState: prev, exit: null };
  }

  if (!prev.active && entering) {
    return {
      nextState: {
        active: true,
        stableUserTurns: 0,
        dismissed: false,
        version: SOFT_CHECK_IN_VERSION,
        enteredAt: new Date(),
      },
      exit: null,
    };
  }

  const level = normalizeRiskLevel(riskLevel);
  const battery = hasCrisisBatterySignal(userContent, crisisDecision);
  const explicitOk = isUserExplicitWellbeingMessage(userContent);
  const protocolWouldActivate = shouldActivateCrisisProtocol({
    riskLevel,
    hardStop,
    messageContent: userContent,
    crisisDecision,
  });

  if (protocolWouldActivate || battery || level === 'MEDIUM' || level === 'HIGH') {
    return {
      nextState: defaultSoftCheckInState(),
      exit: {
        reason: protocolWouldActivate || battery ? 'escalated_to_protocol' : 'risk_escalated',
        riskLevelAtExit: level,
      },
    };
  }

  const stableThisTurn = STABLE_RISK_LEVELS.has(level) && !battery;
  const stableUserTurns = battery ? 0 : prev.stableUserTurns + (stableThisTurn ? 1 : 0);
  const metersStable = stableUserTurns >= STABLE_TURNS_REQUIRED;

  if (metersStable || explicitOk) {
    const reason =
      metersStable && explicitOk
        ? 'both'
        : metersStable
          ? 'meters_stable_2_turns'
          : 'user_explicit_ok';
    return {
      nextState: defaultSoftCheckInState(),
      exit: { reason, riskLevelAtExit: level },
    };
  }

  return {
    nextState: {
      active: true,
      stableUserTurns,
      dismissed: prev.dismissed === true,
      version: SOFT_CHECK_IN_VERSION,
      enteredAt: prev.enteredAt || new Date(),
    },
    exit: null,
  };
}

/**
 * Orquesta avance de estado + payload cliente para un turno.
 */
export function evaluateSoftCrisisCheckInTurn({
  previousState,
  riskLevel,
  messageContent,
  crisisDecision = null,
  hardStop = false,
  crisisProtocolEntering = false,
  crisisProtocolActive = false,
  language = 'es',
  preferences = null,
  phone = null,
} = {}) {
  const { nextState, exit } = advanceSoftCrisisCheckInState(previousState, {
    riskLevel,
    userContent: messageContent,
    crisisDecision,
    hardStop,
    crisisProtocolEntering,
  });

  const showStrip =
    nextState.active === true &&
    nextState.dismissed !== true &&
    !crisisProtocolActive &&
    !crisisProtocolEntering;

  let softCrisisCheckIn = null;
  if (showStrip) {
    const crisisSource = resolveCrisisEmergencySource({ preferences, phone });
    softCrisisCheckIn = buildSoftCrisisCheckInClientPayload({
      language,
      countryOrSource: crisisSource,
    });
  }

  return { softCrisisCheckInState: nextState, softCrisisCheckIn, softCrisisCheckInExit: exit };
}

export function dismissSoftCrisisCheckInState(previousState) {
  const prev = normalizeSoftCrisisCheckInState(previousState);
  if (!prev.active) return prev;
  return { ...prev, dismissed: true };
}

export default {
  normalizeSoftCrisisCheckInState,
  shouldOfferSoftCrisisCheckIn,
  advanceSoftCrisisCheckInState,
  evaluateSoftCrisisCheckInTurn,
  dismissSoftCrisisCheckInState,
};
