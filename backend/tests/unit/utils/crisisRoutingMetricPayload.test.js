/**
 * Tests unitarios para payload de métricas crisis routing.
 */
import { buildCrisisRoutingMetricData } from '../../../utils/crisisRoutingMetricPayload.js';

describe('crisisRoutingMetricPayload', () => {
  it('marca elegible con léxico explícito en HIGH', () => {
    const data = buildCrisisRoutingMetricData({
      riskLevel: 'HIGH',
      transport: 'http',
      messageContent: 'quiero morir',
    });
    expect(data.explicitLexicon).toBe(true);
    expect(data.hardStopEligible).toBe(true);
    expect(data.riskLevel).toBe('HIGH');
  });

  it('no marca elegible en LOW sin léxico', () => {
    const data = buildCrisisRoutingMetricData({
      riskLevel: 'LOW',
      transport: 'http',
      messageContent: 'hola',
    });
    expect(data.explicitLexicon).toBe(false);
    expect(data.hardStopEligible).toBe(false);
  });
});
