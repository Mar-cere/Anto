/**
 * Tests unitarios para constantes de UI
 *
 * @author AntoApp Team
 */

import { STATUS_BAR, OPACITIES, SCALES, SPACING, BORDERS } from '../ui';

describe('ui constants', () => {
  describe('STATUS_BAR', () => {
    it('debe tener STYLE y BACKGROUND', () => {
      expect(STATUS_BAR.STYLE).toBe('light-content');
      expect(STATUS_BAR.BACKGROUND).toBe('transparent');
    });
    it('debe tener DEFAULT_HEIGHT numérico', () => {
      expect(typeof STATUS_BAR.DEFAULT_HEIGHT).toBe('number');
      expect(STATUS_BAR.DEFAULT_HEIGHT).toBe(44);
    });
  });

  describe('OPACITIES', () => {
    it('debe tener opacidades entre 0 y 1', () => {
      expect(OPACITIES.IMAGE_BACKGROUND).toBe(0.1);
      expect(OPACITIES.DISABLED).toBe(0.5);
      expect(OPACITIES.ACTIVE).toBe(0.8);
      expect(OPACITIES.HOVER).toBe(0.7);
    });
    it('todos los valores deben ser números en [0, 1]', () => {
      Object.values(OPACITIES).forEach((o) => {
        expect(o).toBeGreaterThanOrEqual(0);
        expect(o).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('SCALES', () => {
    it('debe tener LOADING, NORMAL y BUTTON_PRESS', () => {
      expect(SCALES.LOADING).toBe(1.5);
      expect(SCALES.NORMAL).toBe(1);
      expect(SCALES.BUTTON_PRESS).toBe(0.95);
    });
  });

  describe('SPACING', () => {
    it('debe tener espaciados positivos', () => {
      expect(SPACING.CONTENT_PADDING_BOTTOM).toBe(120);
      expect(SPACING.ERROR_PADDING).toBe(15);
      expect(SPACING.ERROR_MARGIN_BOTTOM).toBe(20);
      expect(SPACING.ERROR_BUTTON_PADDING_HORIZONTAL).toBe(15);
    });
    it('todos los valores deben ser números positivos', () => {
      Object.values(SPACING).forEach((s) => {
        expect(typeof s).toBe('number');
        expect(s).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('BORDERS', () => {
    it('debe tener ERROR_LEFT_WIDTH y ERROR_BUTTON_RADIUS', () => {
      expect(BORDERS.ERROR_LEFT_WIDTH).toBe(4);
      expect(BORDERS.ERROR_BUTTON_RADIUS).toBe(5);
    });
  });
});
