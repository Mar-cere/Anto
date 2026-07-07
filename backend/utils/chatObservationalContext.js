/**
 * Utilidades compartidas para snippets de contexto en chat (#212 / #216).
 */
import { hasExplicitSuicidalOrSelfHarmLexicon } from '../constants/crisis.js';

/** Niveles que bloquean contexto observacional (fenotipo/ABC) y alertas educativas. */
export const OBSERVATIONAL_BLOCKED_RISK_LEVELS = ['HIGH', 'MEDIUM', 'WARNING'];

const BLOCKED_RISK_LEVELS = new Set(OBSERVATIONAL_BLOCKED_RISK_LEVELS);

export function isChatObservationalContextBlocked(riskLevel) {
  const level = String(riskLevel || 'LOW').trim().toUpperCase();
  return BLOCKED_RISK_LEVELS.has(level);
}

/**
 * Camino LLM en crisis: sin sugerencias, TCC lite, choices ni técnicas insertadas.
 * @param {{ riskLevel?: string, userMessage?: string }} [options]
 */
export function isLlmCrisisTherapeuticExtrasBlocked({ riskLevel, userMessage } = {}) {
  if (isChatObservationalContextBlocked(riskLevel)) return true;
  if (hasExplicitSuicidalOrSelfHarmLexicon(userMessage)) return true;
  return false;
}

export default {
  isChatObservationalContextBlocked,
  isLlmCrisisTherapeuticExtrasBlocked,
};
