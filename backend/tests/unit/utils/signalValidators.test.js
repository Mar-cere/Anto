import {
  extractTypingMetricsPayload,
  isValidDayKey,
  isValidIsoWeekKey,
  resolveClientPhenotypeSource,
} from '../../../utils/signalValidators.js';
import { normalizeSignalConsent } from '../../../services/signalConsentService.js';
import { sanitizeDigitalPhenotypePayload } from '../../../services/digitalPhenotypeService.js';

describe('signalValidators', () => {
  it('isValidIsoWeekKey valida formato ISO', () => {
    expect(isValidIsoWeekKey('2026-W22')).toBe(true);
    expect(isValidIsoWeekKey('2026-W99')).toBe(false);
    expect(isValidIsoWeekKey('invalid')).toBe(false);
  });

  it('isValidDayKey valida YYYY-MM-DD', () => {
    expect(isValidDayKey('2026-06-02')).toBe(true);
    expect(isValidDayKey('2026-6-2')).toBe(false);
  });

  it('extractTypingMetricsPayload rechaza campos de texto', () => {
    expect(extractTypingMetricsPayload({ metrics: { draftDurationMs: 900, text: 'secreto' } })).toBeNull();
    expect(extractTypingMetricsPayload({ metrics: { draftDurationMs: 900 } })).toEqual({
      draftDurationMs: 900,
    });
  });

  it('resolveClientPhenotypeSource no confía en healthkit del cliente', () => {
    expect(resolveClientPhenotypeSource('healthkit')).toBe('stub');
    expect(resolveClientPhenotypeSource('manual')).toBe('manual');
  });
});

describe('sanitizeDigitalPhenotypePayload', () => {
  it('rechaza dayKey inválido', () => {
    expect(sanitizeDigitalPhenotypePayload({ dayKey: 'bad', steps: 100 }, { fromClient: true })).toBeNull();
  });

  it('fuerza source seguro desde cliente', () => {
    const row = sanitizeDigitalPhenotypePayload(
      { dayKey: '2026-06-02', steps: 1000, source: 'healthkit' },
      { fromClient: true },
    );
    expect(row.source).toBe('stub');
  });
});

describe('normalizeSignalConsent', () => {
  it('devuelve objetos anidados independientes', () => {
    const a = normalizeSignalConsent({ typingTelemetry: { enabled: true, enabledAt: null } });
    const b = normalizeSignalConsent({ typingTelemetry: { enabled: true, enabledAt: null } });
    a.typingTelemetry.enabled = false;
    expect(b.typingTelemetry.enabled).toBe(true);
  });
});
