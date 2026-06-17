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
    });

    it('crisis_llm_sanitized incrementa sanitizedResponses y sanitizeHits', async () => {
      const before = metricsService.getCrisisRoutingSnapshot();
      await metricsService.recordMetric('crisis_llm_sanitized', {
        riskLevel: 'MEDIUM',
        hits: ['grounding_invite', 'habit_invite'],
      });
      const snap = metricsService.getCrisisRoutingSnapshot();
      expect(snap.sanitizedResponses).toBe(before.sanitizedResponses + 1);
      expect(snap.sanitizeHits.grounding_invite).toBeGreaterThanOrEqual(1);
      expect(snap.sanitizeHits.habit_invite).toBeGreaterThanOrEqual(1);
    });
  });
});
