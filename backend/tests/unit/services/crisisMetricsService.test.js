/**
 * Tests unitarios para servicio de métricas de crisis
 * 
 * @author AntoApp Team
 */

import crisisMetricsService from '../../../services/crisisMetricsService.js';

describe('CrisisMetricsService', () => {
  describe('Métodos del servicio', () => {
    it('debe tener métodos exportados', () => {
      expect(crisisMetricsService).toBeDefined();
      expect(typeof crisisMetricsService).toBe('object');
    });
  });
});
