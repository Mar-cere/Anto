/**
 * Utilidades compartidas para snippets de contexto en chat (#212 / #216).
 */
import { hasExplicitSuicidalOrSelfHarmLexicon } from '../constants/crisis.js';

const BLOCKED_RISK_LEVELS = new Set(['HIGH', 'MEDIUM', 'WARNING']);

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
