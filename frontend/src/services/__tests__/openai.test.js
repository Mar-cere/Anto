/**
 * Tests unitarios para configuración de OpenAI (frontend)
 *
 * @author AntoApp Team
 */

import { OPENAI_API_KEY, OPENAI_API_URL } from '../openai';

describe('openai (frontend config)', () => {
  describe('OPENAI_API_KEY', () => {
    it('debe ser un string', () => {
      expect(typeof OPENAI_API_KEY).toBe('string');
    });
  });

  describe('OPENAI_API_URL', () => {
    it('debe ser un string', () => {
      expect(typeof OPENAI_API_URL).toBe('string');
    });

    it('debe tener valor por defecto con chat/completions o ser URL válida', () => {
      expect(OPENAI_API_URL.length).toBeGreaterThan(0);
      expect(OPENAI_API_URL).toMatch(/^https?:\/\//);
    });
  });
});
