import { describe, it, expect } from '@jest/globals';
import { normalizeAppleReceiptPayload } from '../../../utils/appleReceiptNormalize.js';

/** Base64 de un buffer que empieza con 0x30 (SEQUENCE DER), como el recibo PKCS#7 de Apple */
function fakePkcs7ReceiptBase64() {
  const buf = Buffer.alloc(48, 0xaa);
  buf[0] = 0x30;
  buf[1] = 0x82;
  return buf.toString('base64');
}

describe('appleReceiptNormalize', () => {
  it('acepta base64 largo sin espacios (PKCS#7)', () => {
    const s = fakePkcs7ReceiptBase64();
    const r = normalizeAppleReceiptPayload(s);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.receipt).toBe(s);
  });

  it('elimina saltos de línea y espacios', () => {
    const core = fakePkcs7ReceiptBase64();
    const half = Math.floor(core.length / 2);
    const r = normalizeAppleReceiptPayload(`  ${core.slice(0, half)} \n ${core.slice(half)}  `);
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

  it('normaliza base64url al estándar que espera verifyReceipt', () => {
    const pk = fakePkcs7ReceiptBase64();
    const url = pk.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const r = normalizeAppleReceiptPayload(url);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const d = Buffer.from(r.receipt, 'base64');
      expect(d[0]).toBe(0x30);
      expect(r.receipt).toMatch(/^[A-Za-z0-9+/=]+$/);
    }
  });

  it('rechaza JWT/JSON', () => {
    const r = normalizeAppleReceiptPayload('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + 'A'.repeat(40));
    expect(r.ok).toBe(false);
  });

  it('rechaza JSON en base64 aunque la cadena no empiece por {', () => {
    const json = JSON.stringify({ signature: 'x'.repeat(80), a: 1 });
    const b64 = Buffer.from(json, 'utf8').toString('base64');
    const r = normalizeAppleReceiptPayload(b64);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/JSON|PKCS/i);
  });

  it('rechaza base64 que no decodifica a PKCS#7 (0x30)', () => {
    const r = normalizeAppleReceiptPayload('A'.repeat(64));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/0x30|PKCS/i);
  });
});
