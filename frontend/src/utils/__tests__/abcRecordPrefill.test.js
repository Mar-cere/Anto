import {
  ABC_PREFILL_MAX_LENGTH,
  parseAbcRecordRouteParams,
} from '../abcRecordPrefill';

describe('parseAbcRecordRouteParams', () => {
  it('acepta prefill solo cuando fromChat es true', () => {
    const out = parseAbcRecordRouteParams({
      fromChat: true,
      prefillActivatingEvent: 'discutir con mi pareja',
    });
    expect(out.prefillActivatingEvent).toMatch(/discutir/i);
    expect(out.fromChat).toBe(true);
  });

  it('ignora prefill si fromChat es false (evita params stale)', () => {
    const out = parseAbcRecordRouteParams({
      fromChat: false,
      prefillActivatingEvent: 'discutir con mi pareja',
    });
    expect(out.prefillActivatingEvent).toBe('');
    expect(out.fromChat).toBe(false);
  });

  it('recorta prefill largo y elimina caracteres de control', () => {
    const long = `${'a'.repeat(ABC_PREFILL_MAX_LENGTH + 20)}`;
    const out = parseAbcRecordRouteParams({
      fromChat: true,
      prefillActivatingEvent: `\u0001${long}`,
    });
    expect(out.prefillActivatingEvent.length).toBeLessThanOrEqual(ABC_PREFILL_MAX_LENGTH);
    expect(out.prefillActivatingEvent).not.toMatch(/\u0001/);
  });

  it('acepta prefill B solo cuando fromChat es true', () => {
    const out = parseAbcRecordRouteParams({
      fromChat: true,
      prefillBeliefs: 'siempre pienso lo peor',
    });
    expect(out.prefillBeliefs).toMatch(/pienso lo peor/i);
    expect(out.prefillActivatingEvent).toBe('');
  });
});
