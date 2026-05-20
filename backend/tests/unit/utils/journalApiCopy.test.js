import { journalApiCopy } from '../../../utils/journalApiCopy.js';

describe('journalApiCopy', () => {
  it('expone mensajes en inglés', () => {
    const copy = journalApiCopy('en');
    expect(copy.notFound).toBe('Entry not found');
    expect(copy.createdSuccess).toMatch(/created/i);
    expect(copy.rateLimitCreate).toMatch(/Too many/i);
  });

  it('expone mensajes Joi en español', () => {
    expect(journalApiCopy('es').joiContentRequired).toMatch(/requerido/i);
  });
});
