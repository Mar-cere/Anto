import { getIsoWeekKey, getPreviousIsoWeekKey, getWeekWindowFromKey } from '../../../utils/weekKeys.js';

describe('weekKeys', () => {
  it('getIsoWeekKey devuelve formato YYYY-Www', () => {
    const key = getIsoWeekKey(new Date('2026-06-02T12:00:00Z'));
    expect(key).toMatch(/^\d{4}-W\d{2}$/);
  });

  it('getPreviousIsoWeekKey retrocede una semana', () => {
    const current = getIsoWeekKey(new Date('2026-06-02T12:00:00Z'));
    const prev = getPreviousIsoWeekKey(new Date('2026-06-02T12:00:00Z'));
    expect(prev).not.toBe(current);
  });

  it('getWeekWindowFromKey produce ventana de 7 días', () => {
    const window = getWeekWindowFromKey('2026-W22');
    expect(window?.since).toBeInstanceOf(Date);
    expect(window?.until).toBeInstanceOf(Date);
    expect(window.until.getTime() - window.since.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });
});
