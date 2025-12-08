/**
 * Tests unitarios para servicio de plantillas terapéuticas
 * 
 * @author AntoApp Team
 */

import therapeuticTemplateService from '../../../services/therapeuticTemplateService.js';

describe('TherapeuticTemplateService', () => {
  describe('Métodos del servicio', () => {
    it('debe tener método getTemplate', () => {
      expect(typeof therapeuticTemplateService.getTemplate).toBe('function');
    });

    it('debe retornar template válido', () => {
      const template = therapeuticTemplateService.getTemplate('tristeza', 'soledad');
      
      expect(template).toBeDefined();
      expect(template).toHaveProperty('validation');
      expect(template).toHaveProperty('psychoeducation');
    });

    it('debe retornar null para emoción inválida', () => {
      const template = therapeuticTemplateService.getTemplate('invalid', 'subtype');
      
      expect(template).toBeNull();
    });
  });
});

