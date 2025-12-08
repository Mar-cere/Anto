/**
 * Tests unitarios para servicio de perfil de usuario
 * 
 * @author AntoApp Team
 */

import userProfileService from '../../../services/userProfileService.js';

describe('UserProfileService', () => {
  describe('Métodos del servicio', () => {
    it('debe tener métodos exportados', () => {
      expect(userProfileService).toBeDefined();
      expect(typeof userProfileService).toBe('object');
    });
  });
});

