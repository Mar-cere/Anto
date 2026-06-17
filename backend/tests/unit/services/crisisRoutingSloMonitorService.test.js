/**
 * Tests unitarios para monitor SLO de crisis routing.
 */
import { evaluateCrisisRoutingSlo } from '../../../services/crisisRoutingSloMonitorService.js';
import { foldCrisisMetricDocs } from '../../../services/crisisRoutingOpsService.js';

describe('crisisRoutingSloMonitorService', () => {
  it('alerta si hard-stop está desactivado', () => {
    const { breaches } = evaluateCrisisRoutingSlo({
      counts: foldCrisisMetricDocs([]),
      crisisHardStopEnabled: false,
    });
    expect(breaches.some((b) => b.code === 'crisis_hard_stop_disabled')).toBe(true);
  });

  it('alerta captura baja entre elegibles con volumen suficiente', () => {
    const counts = foldCrisisMetricDocs([
      {
        type: 'crisis_llm_path',
        data: { riskLevel: 'HIGH', hardStopEligible: true, explicitLexicon: true },
      },
      {
        type: 'crisis_llm_path',
        data: { riskLevel: 'HIGH', hardStopEligible: true, explicitLexicon: true },
      },
      {
        type: 'crisis_llm_path',
        data: { riskLevel: 'HIGH', hardStopEligible: true, explicitLexicon: true },
      },
    ]);

    const { breaches } = evaluateCrisisRoutingSlo({
      counts,
      minRoutingEvents: 3,
      minEligibleEvents: 3,
      minHardStopCaptureAmongEligiblePct: 80,
    });

    expect(breaches.some((b) => b.code === 'crisis_hard_stop_capture_low')).toBe(true);
  });

  it('alerta tasa de sanitización alta', () => {
    const counts = foldCrisisMetricDocs([
      ...Array.from({ length: 10 }, () => ({
        type: 'crisis_llm_path',
        data: { riskLevel: 'MEDIUM' },
      })),
      ...Array.from({ length: 5 }, () => ({
        type: 'crisis_llm_sanitized',
        data: { riskLevel: 'MEDIUM', hits: ['grounding_invite'] },
      })),
    ]);

    const { breaches } = evaluateCrisisRoutingSlo({
      counts,
      minRoutingEvents: 10,
      maxSanitizeRatePct: 30,
    });

    expect(breaches.some((b) => b.code === 'crisis_sanitize_rate_high')).toBe(true);
  });

  it('omite alertas con volumen insuficiente', () => {
    const { breaches, skipped } = evaluateCrisisRoutingSlo({
      counts: foldCrisisMetricDocs([
        { type: 'crisis_llm_path', data: { riskLevel: 'LOW' } },
      ]),
      minRoutingEvents: 10,
    });
    expect(breaches).toHaveLength(0);
    expect(skipped).toBe('insufficient_routing_volume');
  });
});
