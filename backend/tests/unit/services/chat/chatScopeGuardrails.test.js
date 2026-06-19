import {
  buildOffScopeRedirectReply,
  detectOffScopeUserMessage,
  sanitizeOffScopeAssistantReply,
  shouldReplaceOffScopeAssistantReply,
} from '../../../../services/chat/chatScopeGuardrails.js';

describe('chatScopeGuardrails', () => {
  it('detecta preguntas sobre gustos ficticios del asistente', () => {
    expect(
      detectOffScopeUserMessage({ currentMessage: 'quiero saber cual es tu cantante favorito' }),
    ).toBe(true);
  });

  it('detecta small talk de celebridades sin vínculo emocional', () => {
    expect(detectOffScopeUserMessage({ currentMessage: 'te gusta michael jackson' })).toBe(true);
  });

  it('detecta pedidos de biografía o traducción', () => {
    expect(
      detectOffScopeUserMessage({ currentMessage: 'necesito un resumen de su vida, en ingles' }),
    ).toBe(true);
  });

  it('permite cuando hay contexto emocional', () => {
    expect(
      detectOffScopeUserMessage({
        currentMessage: 'la música de Michael Jackson me pone triste desde que murió',
      }),
    ).toBe(false);
  });

  it('permite desahogo emocional directo', () => {
    expect(detectOffScopeUserMessage({ currentMessage: 'me siento muy ansioso hoy' })).toBe(false);
  });

  it('reemplaza biografías generadas tras mensaje off-scope', () => {
    const user = 'necesito un resumen de su vida, en ingles';
    const bio =
      'Michael Jackson was an American singer known as the King of Pop. He began his career with The Jackson 5.';
    expect(shouldReplaceOffScopeAssistantReply(bio, user)).toBe(true);
    const fixed = sanitizeOffScopeAssistantReply(bio, user, 'es');
    expect(fixed).toContain('bienestar emocional');
    expect(fixed).not.toContain('King of Pop');
  });

  it('buildOffScopeRedirectReply en inglés', () => {
    expect(buildOffScopeRedirectReply('en')).toMatch(/emotional well-being/i);
  });
});
