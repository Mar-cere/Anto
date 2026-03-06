/**
 * Tests unitarios para constantes de la pantalla Hábitos.
 * @author AntoApp Team
 */

jest.mock('react-native', () => ({ StatusBar: { currentHeight: 24 } }));
jest.mock('../../../styles/globalStyles', () => ({ colors: { primary: '#0f0', white: '#fff', background: '#000' } }));

import {
  FILTER_TYPES,
  FREQUENCY_TYPES,
  TEXTS,
  getDefaultFormData,
  SWIPE_THRESHOLD,
} from '../habitsScreenConstants';

describe('habitsScreenConstants', () => {
  describe('FILTER_TYPES', () => {
    it('debe tener ACTIVE y ARCHIVED', () => {
      expect(FILTER_TYPES.ACTIVE).toBe('active');
      expect(FILTER_TYPES.ARCHIVED).toBe('archived');
    });
  });

  describe('FREQUENCY_TYPES', () => {
    it('debe tener DAILY y WEEKLY', () => {
      expect(FREQUENCY_TYPES.DAILY).toBe('daily');
      expect(FREQUENCY_TYPES.WEEKLY).toBe('weekly');
    });
  });

  describe('TEXTS', () => {
    it('debe tener título y textos de filtro', () => {
      expect(TEXTS.TITLE).toBe('Mis Hábitos');
      expect(TEXTS.ACTIVE).toBe('Activos');
      expect(TEXTS.ARCHIVED).toBe('Archivados');
    });
    it('debe tener textos de error y retry', () => {
      expect(TEXTS.ERROR_LOAD).toBeDefined();
      expect(TEXTS.RETRY).toBe('Reintentar');
    });
  });

  describe('getDefaultFormData', () => {
    it('debe retornar objeto con title, frequency, icon, reminder', () => {
      const data = getDefaultFormData();
      expect(data).toHaveProperty('title', '');
      expect(data).toHaveProperty('description', '');
      expect(data).toHaveProperty('frequency', 'daily');
      expect(data).toHaveProperty('icon', 'exercise');
      expect(data).toHaveProperty('reminder');
      expect(typeof data.reminder).toBe('string');
    });
  });

  describe('SWIPE_THRESHOLD', () => {
    it('debe ser un número', () => {
      expect(typeof SWIPE_THRESHOLD).toBe('number');
    });
  });
});
