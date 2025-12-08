/**
 * Tests unitarios para utilidad de saludos
 * 
 * @author AntoApp Team
 */

import { getGreetingByHourAndDayAndName } from '../greetings';

describe('greetings', () => {
  describe('getGreetingByHourAndDayAndName', () => {
    it('debe retornar saludo de madrugada para horas 0-5', () => {
      const greeting = getGreetingByHourAndDayAndName({ hour: 3, dayIndex: 0 });
      
      expect(greeting).toBeDefined();
      expect(typeof greeting).toBe('string');
      expect(greeting.length).toBeGreaterThan(0);
    });

    it('debe retornar saludo de mañana para horas 6-11', () => {
      const greeting = getGreetingByHourAndDayAndName({ hour: 8, dayIndex: 1 });
      
      expect(greeting).toBeDefined();
      expect(typeof greeting).toBe('string');
      expect(greeting).toContain('Feliz');
    });

    it('debe retornar saludo de mediodía para horas 12-13', () => {
      const greeting = getGreetingByHourAndDayAndName({ hour: 12, dayIndex: 2 });
      
      expect(greeting).toBeDefined();
      expect(typeof greeting).toBe('string');
      expect(greeting).toContain('Feliz');
    });

    it('debe retornar saludo de tarde para horas 14-18', () => {
      const greeting = getGreetingByHourAndDayAndName({ hour: 16, dayIndex: 3 });
      
      expect(greeting).toBeDefined();
      expect(typeof greeting).toBe('string');
      expect(greeting).toContain('Feliz');
    });

    it('debe retornar saludo de noche para horas 19-23', () => {
      const greeting = getGreetingByHourAndDayAndName({ hour: 20, dayIndex: 4 });
      
      expect(greeting).toBeDefined();
      expect(typeof greeting).toBe('string');
      expect(greeting).toContain('Feliz');
    });

    it('debe incluir nombre de usuario cuando se proporciona', () => {
      const greeting = getGreetingByHourAndDayAndName({ 
        hour: 10, 
        dayIndex: 1, 
        userName: 'Juan' 
      });
      
      expect(greeting).toContain('Juan');
      expect(greeting).toContain('Feliz');
    });

    it('debe incluir día de la semana', () => {
      const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      
      days.forEach((day, index) => {
        const greeting = getGreetingByHourAndDayAndName({ 
          hour: 10, 
          dayIndex: index 
        });
        
        expect(greeting).toContain(day);
      });
    });

    it('debe usar valores por defecto cuando no se proporcionan parámetros', () => {
      const greeting = getGreetingByHourAndDayAndName();
      
      expect(greeting).toBeDefined();
      expect(typeof greeting).toBe('string');
      expect(greeting.length).toBeGreaterThan(0);
    });

    it('debe retornar saludo sin nombre cuando userName está vacío', () => {
      const greeting = getGreetingByHourAndDayAndName({ 
        hour: 10, 
        dayIndex: 1, 
        userName: '' 
      });
      
      expect(greeting).toBeDefined();
      expect(greeting).toContain('Feliz');
      expect(greeting).not.toContain(', .');
    });
  });
});

