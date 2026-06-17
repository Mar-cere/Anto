/**
 * Tests unitarios para agregación ops de crisis routing.
 */
import {
  foldCrisisMetricDocs,
  computeCrisisRoutingRatios,
  mergeCrisisRoutingCounts,
  createEmptyCrisisRoutingCounts,
} from '../../../services/crisisRoutingOpsService.js';

describe('crisisRoutingOpsService', () => {
  it('foldCrisisMetricDocs separa hard-stop y llm path por dimensión', () => {
    const counts = foldCrisisMetricDocs([
      {
        type: 'crisis_hard_stop',
        data: {
          riskLevel: 'HIGH',
          transport: 'http',
          hardStopEligible: true,
          explicitLexicon: true,
        },
      },
      {
        type: 'crisis_llm_path',
        data: {
          riskLevel: 'MEDIUM',
          transport: 'socket',
          hardStopEligible: false,
          explicitLexicon: false,
        },
      },
      {
        type: 'crisis_llm_path',
        data: {
          riskLevel: 'HIGH',
          transport: 'http',
          hardStopEligible: true,
          explicitLexicon: true,
        },
      },
      {
        type: 'crisis_llm_sanitized',
        data: { riskLevel: 'HIGH', transport: 'http', hits: ['grounding_invite'] },
      },
    ]);

    expect(counts.hardStop).toBe(1);
    expect(counts.llmPath).toBe(2);
    expect(counts.hardStopEligibleLlmPath).toBe(1);
    expect(counts.hardStopEligibleHighLlmPath).toBe(1);
    expect(counts.sanitizedResponses).toBe(1);
    expect(counts.sanitizeHits.grounding_invite).toBe(1);
    expect(counts.hardStopByRiskLevel.HIGH).toBe(1);
    expect(counts.llmPathByTransport.socket).toBe(1);
  });

  it('computeCrisisRoutingRatios calcula captura entre elegibles', () => {
    const counts = foldCrisisMetricDocs([
      {
        type: 'crisis_hard_stop',
        data: { riskLevel: 'HIGH', hardStopEligible: true, explicitLexicon: true },
      },
      {
        type: 'crisis_llm_path',
        data: { riskLevel: 'HIGH', hardStopEligible: true, explicitLexicon: true },
      },
    ]);

    const ratios = computeCrisisRoutingRatios(counts);
    expect(ratios.routingTotal).toBe(2);
    expect(ratios.hardStopSharePct).toBe(50);
    expect(ratios.hardStopCaptureAmongEligiblePct).toBe(50);
    expect(ratios.sanitizeRatePct).toBe(0);
  });

  it('mergeCrisisRoutingCounts suma memoria y mongo', () => {
    const a = createEmptyCrisisRoutingCounts();
    a.hardStop = 2;
    a.llmPath = 3;
    const b = createEmptyCrisisRoutingCounts();
    b.hardStop = 1;
    b.llmPath = 1;
    const merged = mergeCrisisRoutingCounts(a, b);
    expect(merged.hardStop).toBe(3);
    expect(merged.llmPath).toBe(4);
  });
});
