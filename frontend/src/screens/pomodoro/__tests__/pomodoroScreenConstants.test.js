/**
 * Tests unitarios para constantes de la pantalla Pomodoro.
 * @author AntoApp Team
 */

jest.mock('../../../styles/globalStyles', () => ({ colors: { background: '#000', primary: '#0f0', white: '#fff' } }));

import {
  WORK_TIME,
  BREAK_TIME,
  LONG_BREAK_TIME,
  TEXTS,
  getModes,
  COLORS,
  STORAGE_KEY,
} from '../pomodoroScreenConstants';

describe('pomodoroScreenConstants', () => {
  describe('tiempos', () => {
    it('WORK_TIME debe ser 25 min en segundos', () => {
      expect(WORK_TIME).toBe(25 * 60);
    });
    it('BREAK_TIME debe ser 5 min en segundos', () => {
      expect(BREAK_TIME).toBe(5 * 60);
    });
    it('LONG_BREAK_TIME debe ser 15 min en segundos', () => {
      expect(LONG_BREAK_TIME).toBe(15 * 60);
    });
  });

  describe('TEXTS', () => {
    it('debe tener título y etiquetas de modo', () => {
      expect(TEXTS.TITLE).toBe('Pomodoro');
      expect(TEXTS.WORK).toBe('Trabajo');
      expect(TEXTS.BREAK).toBe('Descanso');
      expect(TEXTS.LONG_BREAK).toBe('Descanso Largo');
      expect(TEXTS.CUSTOM).toBe('Personalizado');
    });
  });

  describe('getModes', () => {
    it('debe retornar objeto con work, break, longBreak, custom', () => {
      const modes = getModes();
      expect(modes).toHaveProperty('work');
      expect(modes).toHaveProperty('break');
      expect(modes).toHaveProperty('longBreak');
      expect(modes).toHaveProperty('custom');
      expect(modes.work).toHaveProperty('label');
      expect(modes.work).toHaveProperty('time');
    });
  });

  describe('COLORS', () => {
    it('debe tener WORK, BREAK, LONG_BREAK, CUSTOM', () => {
      expect(COLORS.WORK).toBeDefined();
      expect(COLORS.BREAK).toBeDefined();
      expect(COLORS.LONG_BREAK).toBeDefined();
      expect(COLORS.CUSTOM).toBeDefined();
    });
  });

  describe('STORAGE_KEY', () => {
    it('debe ser string', () => {
      expect(typeof STORAGE_KEY).toBe('string');
      expect(STORAGE_KEY).toContain('pomodoro');
    });
  });
});
