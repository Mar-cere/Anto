/**
 * Tests unitarios para constantes de animación
 *
 * @author AntoApp Team
 */

import {
  ANIMATION_VALUES,
  ANIMATION_DURATIONS,
  ANIMATION_DELAYS,
  ANIMATION_SCALES,
  ANIMATION_OPACITIES,
  ANIMATION_TRANSLATES,
  ANIMATION_PRESETS,
} from '../animations';

describe('animations constants', () => {
  describe('ANIMATION_VALUES', () => {
    it('debe tener opacidades inicial y final', () => {
      expect(ANIMATION_VALUES.INITIAL_OPACITY).toBe(0);
      expect(ANIMATION_VALUES.FINAL_OPACITY).toBe(1);
    });
    it('debe tener translate Y inicial y final', () => {
      expect(ANIMATION_VALUES.INITIAL_TRANSLATE_Y).toBe(30);
      expect(ANIMATION_VALUES.FINAL_TRANSLATE_Y).toBe(0);
    });
    it('debe tener escala inicial', () => {
      expect(ANIMATION_VALUES.INITIAL_SCALE).toBe(1);
    });
  });

  describe('ANIMATION_DURATIONS', () => {
    it('debe tener duraciones en ms (FAST < NORMAL < SLOW)', () => {
      expect(ANIMATION_DURATIONS.FAST).toBe(300);
      expect(ANIMATION_DURATIONS.NORMAL).toBe(500);
      expect(ANIMATION_DURATIONS.SLOW).toBe(800);
      expect(ANIMATION_DURATIONS.VERY_SLOW).toBe(1000);
    });
    it('debe tener valores positivos', () => {
      Object.values(ANIMATION_DURATIONS).forEach((d) => {
        expect(d).toBeGreaterThan(0);
      });
    });
  });

  describe('ANIMATION_DELAYS', () => {
    it('debe tener delays definidos', () => {
      expect(ANIMATION_DELAYS.SHORT).toBe(150);
      expect(ANIMATION_DELAYS.MEDIUM).toBe(300);
      expect(ANIMATION_DELAYS.LONG).toBe(500);
      expect(ANIMATION_DELAYS.SCREEN_ENTRY).toBe(1500);
    });
  });

  describe('ANIMATION_SCALES', () => {
    it('debe tener escala de botón y loading', () => {
      expect(ANIMATION_SCALES.BUTTON_PRESS).toBe(0.95);
      expect(ANIMATION_SCALES.LOADING).toBe(1.5);
      expect(ANIMATION_SCALES.NORMAL).toBe(1);
    });
    it('debe tener REFRESH_MIN y REFRESH_MAX', () => {
      expect(ANIMATION_SCALES.REFRESH_MIN).toBeLessThanOrEqual(ANIMATION_SCALES.REFRESH_MAX);
    });
  });

  describe('ANIMATION_OPACITIES', () => {
    it('debe tener HIDDEN 0 y VISIBLE 1', () => {
      expect(ANIMATION_OPACITIES.HIDDEN).toBe(0);
      expect(ANIMATION_OPACITIES.VISIBLE).toBe(1);
    });
    it('debe tener valores entre 0 y 1', () => {
      Object.values(ANIMATION_OPACITIES).forEach((o) => {
        expect(o).toBeGreaterThanOrEqual(0);
        expect(o).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('ANIMATION_TRANSLATES', () => {
    it('debe tener direcciones UP/DOWN/LEFT/RIGHT', () => {
      expect(ANIMATION_TRANSLATES.UP).toBe(-30);
      expect(ANIMATION_TRANSLATES.DOWN).toBe(30);
      expect(ANIMATION_TRANSLATES.LEFT).toBe(-80);
      expect(ANIMATION_TRANSLATES.RIGHT).toBe(80);
    });
    it('debe tener TYPING y NAVBAR', () => {
      expect(ANIMATION_TRANSLATES.TYPING).toBe(-4);
      expect(ANIMATION_TRANSLATES.NAVBAR).toBe(100);
    });
  });

  describe('ANIMATION_PRESETS', () => {
    it('debe tener FADE_IN con initial, final y duration', () => {
      expect(ANIMATION_PRESETS.FADE_IN).toBeDefined();
      expect(ANIMATION_PRESETS.FADE_IN.initial).toBe(ANIMATION_VALUES.INITIAL_OPACITY);
      expect(ANIMATION_PRESETS.FADE_IN.final).toBe(ANIMATION_VALUES.FINAL_OPACITY);
      expect(ANIMATION_PRESETS.FADE_IN.duration).toBe(ANIMATION_DURATIONS.NORMAL);
    });
    it('debe tener SLIDE_UP con initial, final y duration', () => {
      expect(ANIMATION_PRESETS.SLIDE_UP).toBeDefined();
      expect(ANIMATION_PRESETS.SLIDE_UP.initial).toBe(ANIMATION_VALUES.INITIAL_TRANSLATE_Y);
      expect(ANIMATION_PRESETS.SLIDE_UP.final).toBe(ANIMATION_VALUES.FINAL_TRANSLATE_Y);
      expect(ANIMATION_PRESETS.SLIDE_UP.duration).toBe(ANIMATION_DURATIONS.SLOW);
    });
    it('debe tener FADE_SLIDE_UP con opacity y translateY', () => {
      expect(ANIMATION_PRESETS.FADE_SLIDE_UP).toBeDefined();
      expect(ANIMATION_PRESETS.FADE_SLIDE_UP.opacity).toBeDefined();
      expect(ANIMATION_PRESETS.FADE_SLIDE_UP.translateY).toBeDefined();
      expect(ANIMATION_PRESETS.FADE_SLIDE_UP.duration).toBe(ANIMATION_DURATIONS.SLOW);
    });
  });
});
