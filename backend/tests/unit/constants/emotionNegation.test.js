import {
  detectEmotionDenial,
  detectIdiomaticNegatedPositiveEmotion,
  isPositiveEmotionKeywordNegated,
} from '../../../constants/emotionNegation.js';
import emotionalAnalyzer from '../../../services/emotionalAnalyzer.js';

describe('emotionNegation', () => {
  describe('detectIdiomaticNegatedPositiveEmotion', () => {
    it.each([
      [
        'Esperanza ya no porque hice todo lo posible para demostrarle que yo si lo quería',
        'tristeza',
      ],
      ['Ya no tengo esperanza en que esto mejore', 'tristeza'],
      ['Sin ilusión con nada', 'tristeza'],
      ['Ya no me ilusiona nada', 'tristeza'],
      ['No estoy feliz con cómo me fue', 'tristeza'],
      ['Sin ganas de nada', 'tristeza'],
      ['Perdí la fe en que esto mejore', 'tristeza'],
      ['Ya no veo luz al final del túnel', 'tristeza'],
      ['No estoy tranquila, la cabeza no para', 'ansiedad'],
      ['Si . Estoy en el proceso de desanamorame', 'tristeza'],
    ])('detecta modismo negativo: %s', (message, expectedEmotion) => {
      const result = detectIdiomaticNegatedPositiveEmotion(message);
      expect(result).not.toBeNull();
      expect(result.name).toBe(expectedEmotion);
      expect(result.category).toBe('negative');
      expect(result.negationType).toBe('negated_positive');
    });

    it('no confunde esperanza genuina', () => {
      expect(detectIdiomaticNegatedPositiveEmotion('Tengo esperanza de que todo mejore')).toBeNull();
      expect(detectIdiomaticNegatedPositiveEmotion('Me ilusiona volver a intentarlo')).toBeNull();
    });
  });

  describe('detectEmotionDenial', () => {
    it.each([
      ['No estoy triste, solo cansada', 'tristeza'],
      ['No me siento ansioso', 'ansiedad'],
      ['No tengo miedo', 'miedo'],
    ])('detecta negación explícita de emoción negativa: %s', (message, expectedEmotion) => {
      const result = detectEmotionDenial(message);
      expect(result).not.toBeNull();
      expect(result.name).toBe(expectedEmotion);
      expect(result.negationType).toBe('denied_negative');
    });
  });

  describe('isPositiveEmotionKeywordNegated', () => {
    it('detecta esperanza seguida de ya no', () => {
      expect(isPositiveEmotionKeywordNegated('esperanza ya no porque él no', 'esperanza')).toBe(true);
    });

    it('no marca esperanza sin negación', () => {
      expect(isPositiveEmotionKeywordNegated('tengo mucha esperanza', 'esperanza')).toBe(false);
    });
  });
});

describe('emotionalAnalyzer con negación idiomática', () => {
  it('mapea "esperanza ya no" a tristeza, no a esperanza positiva', async () => {
    const message =
      'Esperanza ya no porque hice todo lo posible para demostrarle que yo si lo quería en mi vida pero él no';
    const result = await emotionalAnalyzer.analyzeEmotion(message);
    expect(result.mainEmotion).toBe('tristeza');
    expect(result.category).toBe('negative');
    expect(result.intensity).toBeGreaterThanOrEqual(6);
  });

  it('mantiene esperanza positiva cuando no hay negación', async () => {
    const result = await emotionalAnalyzer.analyzeEmotion('Tengo esperanza de que todo mejore');
    expect(result.mainEmotion).toBe('esperanza');
    expect(result.category).toBe('positive');
  });
});
