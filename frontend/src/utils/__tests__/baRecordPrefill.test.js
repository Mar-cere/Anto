import { parseBaRecordRouteParams } from '../baRecordPrefill';

describe('parseBaRecordRouteParams', () => {
  it('aplica prefill cuando fromChat es true', () => {
    const out = parseBaRecordRouteParams({
      fromChat: true,
      prefillActivityDescription: 'Dar un paseo corto',
      prefillMoodBefore: 6,
      prefillActivityType: 'pleasant',
    });
    expect(out.fromChat).toBe(true);
    expect(out.prefillActivityDescription).toContain('paseo');
    expect(out.prefillMoodBefore).toBe(6);
    expect(out.prefillActivityType).toBe('pleasant');
  });

  it('ignora prefill si fromChat es false', () => {
    const out = parseBaRecordRouteParams({
      fromChat: false,
      prefillActivityDescription: 'Test',
      prefillMoodBefore: 5,
    });
    expect(out.prefillActivityDescription).toBe('');
    expect(out.prefillMoodBefore).toBeNull();
  });
});
