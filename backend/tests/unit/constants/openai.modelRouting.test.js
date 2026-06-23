import { describe, expect, it } from '@jest/globals';
import {
  OPENAI_COMPLEX_MODEL,
  OPENAI_MODEL,
  resolveChatModelForContext,
  resolveModelRoutingForContext
} from '../../../constants/openai.js';

describe('resolveChatModelForContext', () => {
  it('usa modelo base en contexto normal', () => {
    const model = resolveChatModelForContext({
      content: 'hola, hoy me siento algo cansado',
      emotional: { intensity: 4 },
      contextual: { intencion: { confianza: 0.9 } }
    });
    expect(model).toBe(OPENAI_MODEL);
  });

  it('escala a modelo complejo en crisis HIGH', () => {
    const model = resolveChatModelForContext({
      content: 'me siento en crisis',
      crisis: { riskLevel: 'HIGH' }
    });
    expect(model).toBe(OPENAI_COMPLEX_MODEL);
  });

  it('escala a modelo complejo cuando el mensaje es largo y ambiguo', () => {
    const model = resolveChatModelForContext({
      content: 'x'.repeat(300),
      emotional: { intensity: 6 },
      contextual: { intencion: { confianza: 0.45 } }
    });
    expect(model).toBe(OPENAI_COMPLEX_MODEL);
  });
});

describe('resolveModelRoutingForContext', () => {
  it('retorna trazabilidad con reason y score', () => {
    const routing = resolveModelRoutingForContext({
      content: 'x'.repeat(320),
      emotional: { intensity: 8 },
      contextual: { intencion: { confianza: 0.4 } }
    });
    expect(routing.model).toBe(OPENAI_COMPLEX_MODEL);
    expect(routing.route).toBe('complex');
    expect(routing.score).toBeGreaterThanOrEqual(2);
    expect(typeof routing.reason).toBe('string');
  });

  it('prioriza crisis por sobre otras reglas', () => {
    const routing = resolveModelRoutingForContext({
      content: 'hola',
      crisis: { riskLevel: 'MEDIUM' },
      emotional: { intensity: 2 },
      contextual: { intencion: { confianza: 0.95 } }
    });
    expect(routing.model).toBe(OPENAI_COMPLEX_MODEL);
    expect(routing.reason).toBe('crisis_medium');
  });

  it('usa modelo base con razón default cuando no hay señales', () => {
    const routing = resolveModelRoutingForContext({
      content: 'hola, ¿cómo estás?',
      emotional: { intensity: 4 },
      contextual: { intencion: { confianza: 0.9 } }
    });
    expect(routing.model).toBe(OPENAI_MODEL);
    expect(routing.route).toBe('base');
    expect(routing.reason).toBe('default_base');
  });

  it('escala con carga emocional de sesión aunque el mensaje sea corto', () => {
    const routing = resolveModelRoutingForContext({
      content: 'si que?',
      emotional: { intensity: 9, requiresAttention: true },
      contextual: {
        intencion: { tipo: 'CONVERSACION_GENERAL', confianza: 0.5 },
        tema: { categoria: 'GENERAL' }
      },
      sessionEmotionalIntensity: 9
    });
    expect(routing.model).toBe(OPENAI_COMPLEX_MODEL);
    expect(routing.reason).toBe('session_high_emotional_load');
  });
});
