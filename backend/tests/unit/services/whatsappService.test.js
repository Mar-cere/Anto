/**
 * Tests unitarios para servicio de WhatsApp
 * 
 * @author AntoApp Team
 */

import whatsappService from '../../../services/whatsappService.js';

describe('WhatsAppService', () => {
  describe('Métodos del servicio', () => {
    it('debe tener métodos exportados', () => {
      expect(whatsappService).toBeDefined();
      expect(typeof whatsappService).toBe('object');
    });
  });
});

