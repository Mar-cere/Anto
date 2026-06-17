/**
 * Payload estable para métricas crisis_hard_stop / crisis_llm_path (ops + SLO).
 */
import { hasExplicitSuicidalOrSelfHarmLexicon } from '../constants/crisis.js';
import { shouldHardStopCrisisLlm } from '../services/crisisHardStopService.js';

export function buildCrisisRoutingMetricData({
  riskLevel,
  transport,
  messageContent,
} = {}) {
  const content = String(messageContent || '');
  const explicitLexicon = hasExplicitSuicidalOrSelfHarmLexicon(content);
  const hardStopEligible = shouldHardStopCrisisLlm({
    riskLevel,
    messageContent: content,
  });

  return {
    riskLevel: String(riskLevel || 'LOW').toUpperCase(),
    transport: String(transport || 'unknown'),
    explicitLexicon,
    hardStopEligible,
  };
}

export default { buildCrisisRoutingMetricData };
