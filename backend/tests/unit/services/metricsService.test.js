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
  });
});
