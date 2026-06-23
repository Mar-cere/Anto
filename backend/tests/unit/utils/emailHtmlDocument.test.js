import { describe, it, expect } from '@jest/globals';
import {
  buildEmailDarkModeStyles,
  isFullEmailHtmlDocument,
  wrapEmailHtmlDocument,
} from '../../../utils/emailHtmlDocument.js';

describe('emailHtmlDocument', () => {
  it('wrapEmailHtmlDocument incluye meta color-scheme y estilos dark mode', () => {
    const html = wrapEmailHtmlDocument('<div class="email-outer">Hola</div>');
    expect(html).toMatch(/<!DOCTYPE html>/i);
    expect(html).toMatch(/color-scheme" content="light only"/);
    expect(html).toMatch(/prefers-color-scheme: dark/);
    expect(html).toContain('email-outer');
    expect(html).toContain('#24234F');
  });

  it('buildEmailDarkModeStyles fuerza colores de texto y botones', () => {
    const css = buildEmailDarkModeStyles();
    expect(css).toMatch(/a\.email-btn/);
    expect(css).toMatch(/-webkit-text-fill-color/);
    expect(css).toMatch(/email-card/);
  });

  it('isFullEmailHtmlDocument detecta documentos completos', () => {
    expect(isFullEmailHtmlDocument('<!DOCTYPE html><html></html>')).toBe(true);
    expect(isFullEmailHtmlDocument('<div>Hola</div>')).toBe(false);
  });
});
