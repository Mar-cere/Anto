import { describe, expect, it } from '@jest/globals';
import { detectFactualModeFromMessage } from '../../../../services/chat/factualQueryDetector.js';

describe('factualQueryDetector', () => {
  it('detecta consultas factuales directas', () => {
    const result = detectFactualModeFromMessage({
      currentMessage: 'quién es Tina Turner y cuándo nació'
    });
    expect(result).toBe(true);
  });

  it('detecta preguntas de cumpleaños y famosos', () => {
    const result = detectFactualModeFromMessage({
      currentMessage: 'dime famosos que cumplan el 26 de noviembre'
    });
    expect(result).toBe(true);
  });

  it('no activa modo factual en mensajes emocionales', () => {
    const result = detectFactualModeFromMessage({
      currentMessage: 'me siento con mucha ansiedad hoy'
    });
    expect(result).toBe(false);
  });
});
