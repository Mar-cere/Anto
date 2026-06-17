/**
 * Tests unitarios para servicio de métricas
 * 
 * @author AntoApp Team
 */

import metricsService from '../../../services/metricsService.js';

describe('MetricsService', () => {
  describe('Métodos del servicio', () => {
    it('debe tener métodos exportados', () => {
      expect(metricsService).toBeDefined();
      expect(typeof metricsService).toBe('object');
    });

    it('product_action_created incrementa productActionOutcomes', async () => {
      await metricsService.recordMetric(
        'product_action_created',
        { resource: 'task', fromChat: true, idempotentReplay: false },
        '507f1f77bcf86cd799439011'
      );
      const m = metricsService.getMetrics();
      expect(m.productActionOutcomes.created).toBeGreaterThanOrEqual(1);
      expect(m.productActionOutcomes.createdFromChat).toBeGreaterThanOrEqual(1);
    });

    it('product_action_confirm_dismissed incrementa bySurface', async () => {
      await metricsService.recordMetric(
        'product_action_confirm_dismissed',
        { surface: 'task_modal' },
        '507f1f77bcf86cd799439012'
      );
      const m = metricsService.getMetrics();
      expect(m.productActionOutcomes.confirmDismissed).toBeGreaterThanOrEqual(1);
      expect(m.productActionOutcomes.bySurface.task_modal).toBeGreaterThanOrEqual(1);
    });

    it('crisis_hard_stop y crisis_llm_path actualizan crisisRouting', async () => {
      const before = metricsService.getCrisisRoutingSnapshot();
      await metricsService.recordMetric('crisis_hard_stop', {
        riskLevel: 'HIGH',
        transport: 'http',
      });
      await metricsService.recordMetric('crisis_llm_path', {
        riskLevel: 'MEDIUM',
        transport: 'socket',
      });
      const snap = metricsService.getCrisisRoutingSnapshot();
      expect(snap.hardStop).toBe(before.hardStop + 1);
      expect(snap.llmPath).toBe(before.llmPath + 1);
      expect(snap.byRiskLevel.HIGH).toBeGreaterThanOrEqual(1);
      expect(snap.byRiskLevel.MEDIUM).toBeGreaterThanOrEqual(1);
      expect(snap.hardStopByRiskLevel.HIGH).toBeGreaterThanOrEqual(1);
      expect(snap.llmPathByRiskLevel.MEDIUM).toBeGreaterThanOrEqual(1);
      expect(snap.hardStopByTransport.http).toBeGreaterThanOrEqual(1);
      expect(snap.llmPathByTransport.socket).toBeGreaterThanOrEqual(1);
    });

    it('crisis_llm_sanitized incrementa sanitizedResponses y sanitizeHits', async () => {
      const before = metricsService.getCrisisRoutingSnapshot();
      await metricsService.recordMetric('crisis_llm_sanitized', {
        riskLevel: 'MEDIUM',
        hits: ['grounding_invite', 'habit_invite'],
        transport: 'sse',
      });
      const snap = metricsService.getCrisisRoutingSnapshot();
      expect(snap.sanitizedResponses).toBe(before.sanitizedResponses + 1);
      expect(snap.sanitizeHits.grounding_invite).toBeGreaterThanOrEqual(1);
      expect(snap.sanitizeHits.habit_invite).toBeGreaterThanOrEqual(1);
      expect(snap.sanitizedByTransport.sse).toBeGreaterThanOrEqual(1);
      expect(snap.sanitizedByRiskLevel.MEDIUM).toBeGreaterThanOrEqual(1);
    });

    it('getCrisisRoutingSnapshot devuelve copia profunda', () => {
      const snap = metricsService.getCrisisRoutingSnapshot();
      snap.sanitizedByTransport.test = 99;
      snap.byRiskLevel.TEST = 99;
      snap.hardStopByRiskLevel.TEST = 99;
      const snap2 = metricsService.getCrisisRoutingSnapshot();
      expect(snap2.sanitizedByTransport.test).toBeUndefined();
      expect(snap2.byRiskLevel.TEST).toBeUndefined();
      expect(snap2.hardStopByRiskLevel.TEST).toBeUndefined();
    });

    it('getCrisisRoutingOpsSnapshot expone ratios y desglose A/B', async () => {
      await metricsService.recordMetric('crisis_hard_stop', {
        riskLevel: 'HIGH',
        transport: 'http',
      });
      await metricsService.recordMetric('crisis_llm_path', {
        riskLevel: 'HIGH',
        transport: 'http',
      });
      await metricsService.recordMetric('crisis_llm_sanitized', {
        riskLevel: 'HIGH',
        transport: 'http',
        hits: ['grounding_invite'],
      });
      await metricsService.recordMetric('crisis_background_action', {
        riskLevel: 'HIGH',
        transport: 'http',
        phase: 'sync',
        action: 'crisis_event_high',
      });

      const ops = metricsService.getCrisisRoutingOpsSnapshot();
      expect(ops.routing).toEqual(
        expect.objectContaining({
          hardStop: expect.any(Number),
          llmPath: expect.any(Number),
          hardStopSharePct: expect.any(Number),
          llmPathSharePct: expect.any(Number),
          hardStopByRiskLevel: expect.any(Object),
          llmPathByRiskLevel: expect.any(Object),
        }),
      );
      expect(ops.sanitization).toEqual(
        expect.objectContaining({
          sanitizedResponses: expect.any(Number),
          sanitizeRatePct: expect.any(Number),
        }),
      );
      expect(ops.backgroundActions.total).toBeGreaterThanOrEqual(1);
      expect(ops.scope).toBe('process_memory');
    });

    it('crisis_background_action incrementa contadores', async () => {
      await metricsService.recordMetric('crisis_background_action', {
        riskLevel: 'WARNING',
        transport: 'socket',
        phase: 'async',
        action: 'push_warning',
      });
      const ops = metricsService.getCrisisRoutingOpsSnapshot();
      expect(ops.backgroundActions.byRiskLevel.WARNING).toBeGreaterThanOrEqual(1);
      expect(ops.backgroundActions.byTransport.socket).toBeGreaterThanOrEqual(1);
      expect(ops.backgroundActions.byPhase.async).toBeGreaterThanOrEqual(1);
    });
  });
});
