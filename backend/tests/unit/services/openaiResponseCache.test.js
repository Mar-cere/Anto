import { describe, expect, it } from '@jest/globals';
import { generateResponseCacheKey } from '../../../services/openai/openaiResponseCache.js';

describe('openaiResponseCache', () => {
  it('generateResponseCacheKey incluye idioma para evitar mezclar es/en', () => {
    const esKey = generateResponseCacheKey('hello', {}, {}, 'es');
    const enKey = generateResponseCacheKey('hello', {}, {}, 'en');
    expect(esKey).not.toBe(enKey);
  });
});
