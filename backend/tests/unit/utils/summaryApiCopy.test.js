import { summaryApiCopy } from '../../../utils/summaryApiCopy.js';

describe('summaryApiCopy', () => {
  it('mensajes en inglés', () => {
    const copy = summaryApiCopy('en');
    expect(copy.focusError).toMatch(/dashboard focus/i);
    expect(copy.periodRequired).toMatch(/week or month/i);
  });

  it('mensajes en español por defecto', () => {
    const copy = summaryApiCopy();
    expect(copy.summaryError).toMatch(/resumen/);
  });
});
