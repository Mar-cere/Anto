/**
 * Tests unitarios para servicio de análisis de tendencias de crisis
 * 
 * @author AntoApp Team
 */

import crisisTrendAnalyzer from '../../../services/crisisTrendAnalyzer.js';

describe('CrisisTrendAnalyzer Service', () => {
  describe('Métodos del servicio', () => {
    it('debe tener métodos exportados', () => {
      expect(crisisTrendAnalyzer).toBeDefined();
      expect(typeof crisisTrendAnalyzer).toBe('object');
    });
  });
});

