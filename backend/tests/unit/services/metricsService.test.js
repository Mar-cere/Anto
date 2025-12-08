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
  });
});
