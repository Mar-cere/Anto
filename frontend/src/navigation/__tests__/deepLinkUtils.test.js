import { describe, it, expect } from '@jest/globals';
import { shouldOpenActivitySummaryFromUrl } from '../deepLinkUtils';

describe('shouldOpenActivitySummaryFromUrl', () => {
  it('acepta anto:///weekly-summary (path)', () => {
    expect(shouldOpenActivitySummaryFromUrl('anto:///weekly-summary')).toBe(true);
  });

  it('acepta anto://weekly-summary (host)', () => {
    expect(shouldOpenActivitySummaryFromUrl('anto://weekly-summary')).toBe(true);
  });

  it('acepta activity-summary y resumen', () => {
    expect(shouldOpenActivitySummaryFromUrl('anto:///activity-summary')).toBe(true);
    expect(shouldOpenActivitySummaryFromUrl('anto://resumen')).toBe(true);
  });

  it('no abre pagos ni otras rutas', () => {
    expect(shouldOpenActivitySummaryFromUrl('anto://payments/success')).toBe(false);
    expect(shouldOpenActivitySummaryFromUrl('anto:///payments/success')).toBe(false);
    expect(shouldOpenActivitySummaryFromUrl('https://example.com')).toBe(false);
    expect(shouldOpenActivitySummaryFromUrl('')).toBe(false);
  });
});
