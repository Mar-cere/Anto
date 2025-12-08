/**
 * Tests unitarios para middleware de verificación de suscripción
 * 
 * @author AntoApp Team
 */

import { jest } from '@jest/globals';
import { requireActiveSubscription } from '../../../middleware/checkSubscription.js';

describe('CheckSubscription Middleware', () => {
  describe('requireActiveSubscription', () => {
    it('debe ser una función', () => {
      expect(typeof requireActiveSubscription).toBe('function');
    });

    it('debe retornar un middleware', () => {
      const middleware = requireActiveSubscription();
      expect(typeof middleware).toBe('function');
    });
  });
});
