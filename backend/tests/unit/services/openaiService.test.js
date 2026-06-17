/**
 * Tests unitarios para servicio de OpenAI
 * 
 * @author AntoApp Team
 */

import openaiService from '../../../services/openaiService.js';

describe('OpenAIService', () => {
  describe('Métodos del servicio', () => {
    it('debe tener métodos exportados', () => {
      expect(openaiService).toBeDefined();
      expect(typeof openaiService).toBe('object');
    });

    it('debe tener método generateResponse si existe', () => {
      if (typeof openaiService.generateResponse === 'function') {
        expect(typeof openaiService.generateResponse).toBe('function');
      }
    });
  });

  describe('blindaje camino B en crisis', () => {
    const emotional = { intensity: 8, mainEmotion: 'tristeza' };
    const contextual = { intencion: { tipo: 'CRISIS' } };

    it('shouldAddChoices devuelve false en crisis MEDIUM', () => {
      expect(
        openaiService.shouldAddChoices(emotional, contextual, null, {
          crisis: { riskLevel: 'MEDIUM' },
          userMessage: 'no quiero seguir',
        }),
      ).toBe(false);
    });

    it('shouldIncludeTechnique devuelve false en crisis HIGH aunque pida técnica', () => {
      expect(
        openaiService.shouldIncludeTechnique(
          emotional,
          contextual,
          { content: 'dame una técnica de respiración' },
          {
            crisis: { riskLevel: 'HIGH' },
            userMessage: 'dame una técnica de respiración',
          },
        ),
      ).toBe(false);
    });

    it('shouldAddChoices permite elecciones fuera de crisis con intensidad alta', () => {
      expect(
        openaiService.shouldAddChoices(
          { intensity: 7 },
          { intencion: { tipo: 'SEEKING_HELP' } },
          null,
          { crisis: { riskLevel: 'LOW' }, userMessage: 'necesito ayuda' },
        ),
      ).toBe(true);
    });

    it('applyCrisisResponseSafety aplica post-proceso en WARNING con crisis en contexto', () => {
      const result = openaiService.applyCrisisResponseSafety('Gracias por contarme.', {
        crisis: { riskLevel: 'WARNING' },
        emotional: { intensity: 8 },
        contextual: { intencion: { tipo: 'CRISIS' } },
        userMessage: 'no aguanto más',
        profile: { preferences: { language: 'es' } },
        conversationHistory: [],
      });
      expect(result).toMatch(/seguridad|salvo/i);
    });

    it('applyCrisisResponseSafety quita lenguaje conductual en MEDIUM', () => {
      const result = openaiService.applyCrisisResponseSafety(
        'Te escucho. Mañana podemos planificar una rutina de hábitos.',
        {
          crisis: { riskLevel: 'MEDIUM' },
          emotional: { intensity: 8 },
          contextual: { intencion: { tipo: 'CRISIS' } },
          userMessage: 'no aguanto',
          profile: { preferences: { language: 'es' } },
          conversationHistory: [],
        },
      );
      expect(result).not.toMatch(/hábitos/i);
      expect(result).toMatch(/seguridad|salvo/i);
    });

    it('applyCrisisResponseSafety sanitiza en LOW con intención CRISIS e intensidad alta', () => {
      const result = openaiService.applyCrisisResponseSafety(
        'Te escucho. Mañana podemos planificar una activación conductual.',
        {
          crisis: { riskLevel: 'LOW' },
          emotional: { intensity: 8 },
          contextual: { intencion: { tipo: 'CRISIS' } },
          userMessage: 'estoy mal',
          profile: { preferences: { language: 'es' } },
          conversationHistory: [],
        },
      );
      expect(result).not.toMatch(/activación conductual/i);
    });

    it('resolveCrisisMetricTransport prioriza crisisMetricTransport', () => {
      expect(
        openaiService.resolveCrisisMetricTransport({
          crisisMetricTransport: 'sse',
          _promptTelemetry: { source: 'http' },
        }),
      ).toBe('sse');
      expect(
        openaiService.resolveCrisisMetricTransport({
          _promptTelemetry: { source: 'guest' },
        }),
      ).toBe('guest');
    });

    it('applyCrisisResponseSafety usa copy EN en addSafetyChecks', () => {
      const result = openaiService.applyCrisisResponseSafety('I hear you.', {
        crisis: { riskLevel: 'HIGH' },
        emotional: { intensity: 9 },
        contextual: { intencion: { tipo: 'CRISIS' } },
        userMessage: 'I feel awful',
        profile: { preferences: { language: 'en' } },
        conversationHistory: [],
      });
      expect(result).toMatch(/About this chat/i);
      expect(result).toMatch(/Urgent safety protocol|Are you safe/i);
    });
  });
});

