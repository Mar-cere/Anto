import {
  buildLiteralPolarityCautionSnippet,
  buildMessageComprehensionSnippet,
  detectsLiteralPolarityCaution,
} from '../../../../services/chat/messageComprehensionSnippet.js';

describe('messageComprehensionSnippet', () => {
  describe('detectsLiteralPolarityCaution', () => {
    it('detecta "Nada he podido avanzar" como progreso afirmativo', () => {
      expect(
        detectsLiteralPolarityCaution(
          'Nada he podido avanzar con mis cosas, mi pareja esta yendo a psicóloga'
        )
      ).toBe(true);
    });

    it('detecta "Nada, he podido"', () => {
      expect(detectsLiteralPolarityCaution('Nada, he podido avanzar con mis cosas')).toBe(true);
    });

    it('detecta EN nothing much + been able', () => {
      expect(
        detectsLiteralPolarityCaution(
          "Nothing much, I've been able to make progress with my stuff"
        )
      ).toBe(true);
    });

    it('no marca "Nada no he podido" (negación real)', () => {
      expect(detectsLiteralPolarityCaution('Nada no he podido avanzar esta semana')).toBe(false);
    });

    it('no marca "no he podido" sin filler', () => {
      expect(detectsLiteralPolarityCaution('No he podido avanzar con mis cosas')).toBe(false);
    });
  });

  describe('snippets', () => {
    it('ES incluye anclas de comprensión', () => {
      const s = buildMessageComprehensionSnippet('es');
      expect(s).toContain('### Comprensión del mensaje');
      expect(s).toContain('no reformules como estancamiento');
    });

    it('EN incluye anclas de comprensión', () => {
      const s = buildMessageComprehensionSnippet('en');
      expect(s).toContain('### Message comprehension');
      expect(s).toContain('reframe as being stuck');
    });

    it('caution snippet solo si hay match', () => {
      expect(buildLiteralPolarityCautionSnippet('es', 'Hola')).toBe('');
      expect(
        buildLiteralPolarityCautionSnippet('es', 'Nada, he podido avanzar')
      ).toContain('### Literal polarity caution');
    });
  });
});
