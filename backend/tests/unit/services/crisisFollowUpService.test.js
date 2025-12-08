/**
 * Tests unitarios para servicio de seguimiento de crisis
 * 
 * @author AntoApp Team
 */

import crisisFollowUpService from '../../../services/crisisFollowUpService.js';

describe('CrisisFollowUpService', () => {
  describe('Métodos del servicio', () => {
    it('debe tener métodos exportados', () => {
      expect(crisisFollowUpService).toBeDefined();
      expect(typeof crisisFollowUpService).toBe('object');
    });
  });
});

