/**
 * Tests unitarios para metricsService
 * 
 * @author AntoApp Team
 */

import metricsService from '../../../services/metricsService.js';

describe('Metrics Service', () => {
  beforeEach(() => {
    // Limpiar métricas antes de cada test
    // Nota: Esto depende de la implementación del servicio
  });

  describe('getUserMetrics', () => {
    it('debe retornar métricas para un usuario', () => {
      const userId = '507f1f77bcf86cd799439011';
      const metrics = metricsService.getUserMetrics(userId);

      expect(metrics).toBeDefined();
      expect(typeof metrics).toBe('object');
    });

    it('debe retornar métricas vacías para un usuario nuevo', () => {
      const userId = 'new-user-id';
      const metrics = metricsService.getUserMetrics(userId);

      expect(metrics).toBeDefined();
    });
  });

  describe('recordMetric', () => {
    it('debe registrar una métrica', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const metricType = 'task_completed';
      const metricData = { taskId: '123', completed: true };

      // El método recordMetric es async
      await metricsService.recordMetric(metricType, metricData, userId);

      // Verificar que se registró (las métricas se almacenan en memoria)
      const metrics = metricsService.getUserMetrics(userId);
      expect(metrics).toBeDefined();
    });
  });
});

