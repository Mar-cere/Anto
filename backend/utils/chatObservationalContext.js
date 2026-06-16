/**
 * Utilidades compartidas para snippets de contexto en chat (#212 / #216).
 */
const BLOCKED_RISK_LEVELS = new Set(['HIGH', 'MEDIUM', 'WARNING']);

export function isChatObservationalContextBlocked(riskLevel) {
  const level = String(riskLevel || 'LOW').trim().toUpperCase();
  return BLOCKED_RISK_LEVELS.has(level);
}

export default {
  isChatObservationalContextBlocked,
};
