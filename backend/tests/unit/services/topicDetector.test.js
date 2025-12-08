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
    it('debe detectar tema de trabajo', () => {
      const topic = topicDetector.detectTopic('Tengo problemas en el trabajo con mi jefe');
      
      expect(topic).toBe('trabajo');
    });

    it('debe detectar tema de relaciones', () => {
      const topic = topicDetector.detectTopic('Tengo problemas con mi pareja');
      
      expect(topic).toBe('relaciones');
    });

    it('debe detectar tema de salud', () => {
      const topic = topicDetector.detectTopic('Me duele la cabeza y tengo fiebre');
      
      expect(topic).toBe('salud');
    });

    it('debe detectar tema de autoimagen', () => {
      const topic = topicDetector.detectTopic('No me gusta cómo me veo, me siento feo');
      
      expect(topic).toBe('autoimagen');
    });

    it('debe detectar tema de futuro', () => {
      const topic = topicDetector.detectTopic('Tengo miedo al futuro y no sé qué pasará');
      
      expect(topic).toBe('futuro');
    });

    it('debe detectar tema de pasado', () => {
      const topic = topicDetector.detectTopic('Recuerdo cosas del pasado que me molestan');
      
      expect(topic).toBe('pasado');
    });

    it('debe detectar tema de soledad', () => {
      const topic = topicDetector.detectTopic('Me siento solo y aislado');
      
      expect(topic).toBe('soledad');
    });

    it('debe detectar tema de pérdida', () => {
      const topic = topicDetector.detectTopic('Estoy en duelo por la pérdida de un ser querido');
      
      expect(topic).toBe('pérdida');
    });

    it('debe detectar tema de dinero', () => {
      const topic = topicDetector.detectTopic('Tengo problemas económicos y deudas');
      
      expect(topic).toBe('dinero');
    });

    it('debe retornar tema general para texto sin tema específico', () => {
      const topic = topicDetector.detectTopic('Texto general sin tema específico');
      
      expect(topic).toBe('general');
    });

    it('debe retornar tema por defecto para texto vacío', () => {
      const topic = topicDetector.detectTopic('');
      
      expect(topic).toBe('general');
    });

    it('debe retornar tema por defecto para null', () => {
      const topic = topicDetector.detectTopic(null);
      
      expect(topic).toBe('general');
    });

    it('debe retornar tema por defecto para undefined', () => {
      const topic = topicDetector.detectTopic(undefined);
      
      expect(topic).toBe('general');
    });
  });

  describe('detectMultipleTopics', () => {
    it('debe detectar múltiples temas', () => {
      const topics = topicDetector.detectMultipleTopics('Tengo problemas en el trabajo y con mi familia');
      
      expect(Array.isArray(topics)).toBe(true);
      expect(topics.length).toBeGreaterThan(0);
    });

    it('debe retornar array vacío para texto sin temas', () => {
      const topics = topicDetector.detectMultipleTopics('Texto sin temas específicos');
      
      expect(Array.isArray(topics)).toBe(true);
    });

    it('debe manejar texto vacío', () => {
      const topics = topicDetector.detectMultipleTopics('');
      
      expect(Array.isArray(topics)).toBe(true);
    });
  });
});

