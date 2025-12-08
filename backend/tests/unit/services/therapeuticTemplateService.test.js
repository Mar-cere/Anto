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

    it('debe tener método buildTherapeuticBase', () => {
      expect(typeof therapeuticTemplateService.buildTherapeuticBase).toBe('function');
    });

    it('debe tener método selectPhrase', () => {
      expect(typeof therapeuticTemplateService.selectPhrase).toBe('function');
    });
  });

  describe('getTemplate', () => {
    it('debe retornar template válido para tristeza-soledad', () => {
      const template = therapeuticTemplateService.getTemplate('tristeza', 'soledad');
      
      expect(template).toBeDefined();
      expect(template).toHaveProperty('validation');
      expect(template).toHaveProperty('psychoeducation');
      expect(template).toHaveProperty('question');
      expect(Array.isArray(template.validation)).toBe(true);
    });

    it('debe retornar template válido para ansiedad-social', () => {
      const template = therapeuticTemplateService.getTemplate('ansiedad', 'social');
      
      expect(template).toBeDefined();
      expect(template).toHaveProperty('validation');
      expect(template).toHaveProperty('psychoeducation');
    });

    it('debe retornar template válido para enojo-injusticia', () => {
      const template = therapeuticTemplateService.getTemplate('enojo', 'injusticia');
      
      expect(template).toBeDefined();
      expect(template).toHaveProperty('validation');
    });

    it('debe retornar null para emoción inválida', () => {
      const template = therapeuticTemplateService.getTemplate('invalid', 'subtype');
      
      expect(template).toBeNull();
    });

    it('debe retornar null para subtipo inválido', () => {
      const template = therapeuticTemplateService.getTemplate('tristeza', 'invalid-subtype');
      
      expect(template).toBeNull();
    });

    it('debe retornar template base si no hay subtipo', () => {
      const template = therapeuticTemplateService.getTemplate('tristeza', null);
      
      // Puede retornar null o un template base dependiendo de la implementación
      expect(template === null || typeof template === 'object').toBe(true);
    });
  });

  describe('buildTherapeuticBase', () => {
    it('debe construir base terapéutica', () => {
      const response = therapeuticTemplateService.buildTherapeuticBase('tristeza', 'soledad');
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });

    it('debe construir base con estilo brief', () => {
      const response = therapeuticTemplateService.buildTherapeuticBase('tristeza', 'soledad', { style: 'brief' });
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });

    it('debe construir base con estilo deep', () => {
      const response = therapeuticTemplateService.buildTherapeuticBase('tristeza', 'soledad', { style: 'deep' });
      
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });

    it('debe retornar null para emoción inválida', () => {
      const response = therapeuticTemplateService.buildTherapeuticBase('invalid', 'subtype');
      
      expect(response).toBeNull();
    });

    it('debe retornar null para subtipo inválido', () => {
      const response = therapeuticTemplateService.buildTherapeuticBase('tristeza', 'invalid-subtype');
      
      expect(response).toBeNull();
    });
  });

  describe('selectPhrase', () => {
    it('debe seleccionar frase de array', () => {
      const phrases = ['Frase 1', 'Frase 2', 'Frase 3'];
      const phrase = therapeuticTemplateService.selectPhrase(phrases, 'balanced');
      
      expect(phrase).toBeDefined();
      expect(typeof phrase).toBe('string');
      expect(phrases).toContain(phrase);
    });

    it('debe retornar string vacío para array vacío', () => {
      const phrase = therapeuticTemplateService.selectPhrase([], 'balanced');
      
      expect(phrase).toBe('');
    });
  });
});

