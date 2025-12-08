/**
 * Tests unitarios para detector de temas
 * 
 * @author AntoApp Team
 */

import topicDetector from '../../../services/topicDetector.js';

describe('TopicDetector Service', () => {
  describe('Métodos del servicio', () => {
    it('debe tener método detectTopic', () => {
      expect(typeof topicDetector.detectTopic).toBe('function');
    });

    it('debe tener método detectMultipleTopics', () => {
      expect(typeof topicDetector.detectMultipleTopics).toBe('function');
    });
  });

  describe('detectTopic', () => {
    it('debe detectar tema del texto', () => {
      const topic = topicDetector.detectTopic('Tengo problemas en el trabajo');
      
      expect(topic).toBeDefined();
      expect(typeof topic).toBe('string');
    });

    it('debe retornar tema por defecto para texto vacío', () => {
      const topic = topicDetector.detectTopic('');
      
      expect(topic).toBeDefined();
    });
  });

  describe('detectMultipleTopics', () => {
    it('debe detectar múltiples temas', () => {
      const topics = topicDetector.detectMultipleTopics('Tengo problemas en el trabajo y con mi familia');
      
      expect(Array.isArray(topics)).toBe(true);
    });
  });
});

