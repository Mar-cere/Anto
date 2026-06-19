import { describe, expect, it } from '@jest/globals';
import {
  generateResponseCacheKey,
  isCachedResponseDuplicateInThread,
  isCachedResponseValid,
  shouldBypassResponseCache,
} from '../../../services/openai/openaiResponseCache.js';

describe('openaiResponseCache', () => {
  it('generateResponseCacheKey incluye idioma para evitar mezclar es/en', () => {
    const esKey = generateResponseCacheKey('hello', {}, {}, 'es');
    const enKey = generateResponseCacheKey('hello', {}, {}, 'en');
    expect(esKey).not.toBe(enKey);
  });

  it('generateResponseCacheKey distingue conversación y último turno del asistente', () => {
    const base = generateResponseCacheKey('hello', {}, {}, 'es', {
      conversationId: 'abc',
      lastAssistantSignature: 'pregunta previa',
    });
    const otherThread = generateResponseCacheKey('hello', {}, {}, 'es', {
      conversationId: 'xyz',
      lastAssistantSignature: 'pregunta previa',
    });
    const otherTurn = generateResponseCacheKey('hello', {}, {}, 'es', {
      conversationId: 'abc',
      lastAssistantSignature: 'otra pregunta',
    });
    expect(base).not.toBe(otherThread);
    expect(base).not.toBe(otherTurn);
  });

  it('shouldBypassResponseCache evita afirmaciones cortas como "Si"', () => {
    expect(shouldBypassResponseCache('Si')).toBe(true);
    expect(shouldBypassResponseCache('Sí.')).toBe(true);
    expect(shouldBypassResponseCache('ok')).toBe(true);
    expect(shouldBypassResponseCache('Me cuesta concentrarme cuando hay ruido')).toBe(false);
  });

  it('isCachedResponseValid rechaza respuestas ya emitidas en el hilo', () => {
    const cached = {
      response: 'Tiene sentido: con más silencio te resulta más fácil enfocarte.',
      timestamp: Date.now(),
    };
    const history = [
      { role: 'assistant', content: cached.response },
      { role: 'user', content: 'Si' },
    ];
    expect(isCachedResponseValid(cached, {}, history)).toBe(false);
  });

  it('isCachedResponseDuplicateInThread detecta repetición literal', () => {
    const text = 'Respuesta previa del asistente';
    expect(
      isCachedResponseDuplicateInThread(text, [{ role: 'assistant', content: text }]),
    ).toBe(true);
  });
});
