import { describe, it, expect } from '@jest/globals';
import { normalizeAppleReceiptPayload } from '../../../utils/appleReceiptNormalize.js';

describe('appleReceiptNormalize', () => {
  it('acepta base64 largo sin espacios', () => {
    const s = 'A'.repeat(64);
    const r = normalizeAppleReceiptPayload(s);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.receipt).toBe(s);
  });

  it('elimina saltos de línea y espacios', () => {
    const core = 'B'.repeat(40);
    const r = normalizeAppleReceiptPayload(`  ${core.slice(0, 20)} \n ${core.slice(20)}  `);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.receipt).toBe(core);
  });

  it('rechaza vacío', () => {
    const r = normalizeAppleReceiptPayload('   ');
    expect(r.ok).toBe(false);
  });

  it('rechaza demasiado corto', () => {
    const r = normalizeAppleReceiptPayload('ABCD');
    expect(r.ok).toBe(false);
  });

  it('rechaza JWT/JSON', () => {
    const r = normalizeAppleReceiptPayload('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + 'A'.repeat(40));
    expect(r.ok).toBe(false);
  });
});
