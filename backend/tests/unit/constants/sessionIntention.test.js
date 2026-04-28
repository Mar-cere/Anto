import {
  normalizeSessionIntention,
  sanitizeSessionIntentionForClient,
  wasSessionIntentionProvided
} from '../../../constants/sessionIntention.js';

describe('sessionIntention constants', () => {
  describe('normalizeSessionIntention', () => {
    it('acepta los cuatro valores API', () => {
      expect(normalizeSessionIntention('vent')).toBe('vent');
      expect(normalizeSessionIntention('organize')).toBe('organize');
      expect(normalizeSessionIntention('technique')).toBe('technique');
      expect(normalizeSessionIntention('plan')).toBe('plan');
    });

    it('recorta espacios', () => {
      expect(normalizeSessionIntention('  vent  ')).toBe('vent');
    });

    it('rechaza valores desconocidos', () => {
      expect(normalizeSessionIntention('foo')).toBeNull();
      expect(normalizeSessionIntention('VENT')).toBeNull();
    });

    it('trata vacío como null', () => {
      expect(normalizeSessionIntention(null)).toBeNull();
      expect(normalizeSessionIntention(undefined)).toBeNull();
      expect(normalizeSessionIntention('')).toBeNull();
      expect(normalizeSessionIntention('   ')).toBeNull();
    });
  });

  describe('wasSessionIntentionProvided', () => {
    it('detecta omisión vs presencia', () => {
      expect(wasSessionIntentionProvided(undefined)).toBe(false);
      expect(wasSessionIntentionProvided(null)).toBe(false);
      expect(wasSessionIntentionProvided('')).toBe(false);
      expect(wasSessionIntentionProvided('  ')).toBe(false);
      expect(wasSessionIntentionProvided('vent')).toBe(true);
      expect(wasSessionIntentionProvided(' x ')).toBe(true);
    });
  });

  describe('sanitizeSessionIntentionForClient', () => {
    it('equivale a normalizar para respuestas API', () => {
      expect(sanitizeSessionIntentionForClient('plan')).toBe('plan');
      expect(sanitizeSessionIntentionForClient('legacy')).toBeNull();
    });
  });
});
