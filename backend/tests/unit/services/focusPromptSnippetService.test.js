/**
 * Tests para focusPromptSnippetService.
 */
import { jest } from '@jest/globals';

describe('focusPromptSnippetService', () => {
  let buildFocusPromptSnippet;
  let hasActiveFocus;
  let User;
  let FOCUS_STATUS;

  beforeAll(async () => {
    // Import dependencies
    User = (await import('../../../models/User.js')).default;
    FOCUS_STATUS = (await import('../../../constants/focusThemes.js')).FOCUS_STATUS;
    
    // Import service
    const service = await import('../../../services/focusPromptSnippetService.js');
    buildFocusPromptSnippet = service.buildFocusPromptSnippet;
    hasActiveFocus = service.hasActiveFocus;
  });

  describe('buildFocusPromptSnippet', () => {
    it('debe devolver null cuando userId no está presente', async () => {
      const snippet = await buildFocusPromptSnippet(null, 'es');
      expect(snippet).toBeNull();
    });

    it('debe devolver null cuando no hay foco activo', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({
          activeFocus: null,
        }),
      };

      User.findById = jest.fn().mockReturnValue(mockChain);

      const snippet = await buildFocusPromptSnippet('user123', 'es');

      expect(snippet).toBeNull();
    });

    it('debe devolver null cuando el foco no está activo', async () => {
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({
          activeFocus: {
            themeId: 'anxiety',
            status: FOCUS_STATUS.PAUSED,
          },
        }),
      });

      const snippet = await buildFocusPromptSnippet('user123', 'es');

      expect(snippet).toBeNull();
    });

    it('debe construir snippet en español con foco activo', async () => {
      const mockUser = {
        activeFocus: {
          themeId: 'anxiety',
          startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
          durationWeeks: 4,
          customGoal: 'Manejar mejor mi ansiedad laboral',
          status: FOCUS_STATUS.ACTIVE,
        },
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUser),
      };

      User.findById = jest.fn().mockReturnValue(mockChain);

      const snippet = await buildFocusPromptSnippet('user123', 'es');

      expect(snippet).toBeTruthy();
      expect(snippet).toContain('**Foco de acompañamiento activo:**');
      expect(snippet).toContain('- Tema: Ansiedad');
      expect(snippet).toContain('- Semana: 2/4');
      expect(snippet).toContain('- Objetivo del usuario: "Manejar mejor mi ansiedad laboral"');
      expect(snippet).toContain('Durante este proceso de acompañamiento:');
      expect(snippet).toContain('Mantén presente este foco temático en tus respuestas');
    });

    it('debe construir snippet en inglés con foco activo', async () => {
      const mockUser = {
        activeFocus: {
          themeId: 'boundaries',
          startedAt: new Date(),
          durationWeeks: 4,
          customGoal: null,
          status: FOCUS_STATUS.ACTIVE,
        },
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUser),
      };

      User.findById = jest.fn().mockReturnValue(mockChain);

      const snippet = await buildFocusPromptSnippet('user123', 'en');

      expect(snippet).toBeTruthy();
      expect(snippet).toContain('**Active accompaniment focus:**');
      expect(snippet).toContain('- Theme: Boundaries');
      expect(snippet).toContain('- Week: 1/4');
      expect(snippet).not.toContain('User goal');
      expect(snippet).toContain('During this accompaniment process:');
      expect(snippet).toContain('Keep this thematic focus in mind in your responses');
    });

    it('debe omitir objetivo cuando customGoal es null', async () => {
      const mockUser = {
        activeFocus: {
          themeId: 'selfCare',
          startedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
          durationWeeks: 4,
          customGoal: null,
          status: FOCUS_STATUS.ACTIVE,
        },
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUser),
      };

      User.findById = jest.fn().mockReturnValue(mockChain);

      const snippet = await buildFocusPromptSnippet('user123', 'es');

      expect(snippet).toBeTruthy();
      expect(snippet).not.toContain('Objetivo del usuario');
      expect(snippet).toContain('- Semana: 3/4');
    });

    it('debe sanitizar customGoal eliminando saltos de línea y espacios múltiples', async () => {
      const mockUser = {
        activeFocus: {
          themeId: 'anxiety',
          startedAt: new Date(),
          durationWeeks: 4,
          customGoal: 'Manejar   mejor\n\nmi   ansiedad\tlaboral',
          status: FOCUS_STATUS.ACTIVE,
        },
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUser),
      };

      User.findById = jest.fn().mockReturnValue(mockChain);

      const snippet = await buildFocusPromptSnippet('user123', 'es');

      expect(snippet).toBeTruthy();
      // El customGoal sanitizado debe aparecer sin saltos de línea dobles ni espacios múltiples
      expect(snippet).toContain('Objetivo del usuario: "Manejar mejor mi ansiedad laboral"');
      // Verificar que no contiene el formato sin sanitizar
      expect(snippet).not.toContain('Manejar   mejor');
      expect(snippet).not.toContain('mi   ansiedad');
    });

    it('debe truncar customGoal si excede 150 caracteres', async () => {
      const longGoal = 'A'.repeat(200);
      const mockUser = {
        activeFocus: {
          themeId: 'boundaries',
          startedAt: new Date(),
          durationWeeks: 4,
          customGoal: longGoal,
          status: FOCUS_STATUS.ACTIVE,
        },
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUser),
      };

      User.findById = jest.fn().mockReturnValue(mockChain);

      const snippet = await buildFocusPromptSnippet('user123', 'es');

      expect(snippet).toBeTruthy();
      const goalMatch = snippet.match(/Objetivo del usuario: "(.+)"/);
      expect(goalMatch).toBeTruthy();
      expect(goalMatch[1].length).toBeLessThanOrEqual(150);
    });
  });

  describe('hasActiveFocus', () => {
    it('debe devolver false cuando userId no está presente', async () => {
      const result = await hasActiveFocus(null);
      expect(result).toBe(false);
    });

    it('debe devolver true cuando hay foco activo', async () => {
      const mockUser = {
        activeFocus: {
          themeId: 'anxiety',
          startedAt: new Date(),
          durationWeeks: 4,
          status: FOCUS_STATUS.ACTIVE,
        },
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUser),
      };

      User.findById = jest.fn().mockReturnValue(mockChain);

      const result = await hasActiveFocus('user123');

      expect(result).toBe(true);
    });

    it('debe devolver false cuando no hay foco activo', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({ activeFocus: null }),
      };

      User.findById = jest.fn().mockReturnValue(mockChain);

      const result = await hasActiveFocus('user123');

      expect(result).toBe(false);
    });

    it('debe devolver false cuando el foco está pausado', async () => {
      const mockUser = {
        activeFocus: {
          themeId: 'anxiety',
          status: FOCUS_STATUS.PAUSED,
        },
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUser),
      };

      User.findById = jest.fn().mockReturnValue(mockChain);

      const result = await hasActiveFocus('user123');

      expect(result).toBe(false);
    });
  });
});
