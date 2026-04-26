import { describe, expect, it } from '@jest/globals';
import { OPENAI_COMPLEX_MODEL, OPENAI_MODEL, resolveChatModelForContext } from '../../../constants/openai.js';

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
