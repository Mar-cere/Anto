import {
  HOME_FOCUS_REFRESH_MIN_MS,
  mergeFocusResponse,
  shouldRefreshHomeOnFocus,
} from '../dashboardHomeRefresh';

describe('dashboardHomeRefresh', () => {
  it('shouldRefreshHomeOnFocus permite el primer refresh', () => {
    expect(shouldRefreshHomeOnFocus(0, 1000)).toBe(true);
  });

  it('shouldRefreshHomeOnFocus throttlea refrescos seguidos', () => {
    const last = 10_000;
    expect(
      shouldRefreshHomeOnFocus(last, last + HOME_FOCUS_REFRESH_MIN_MS - 1),
    ).toBe(false);
    expect(
      shouldRefreshHomeOnFocus(last, last + HOME_FOCUS_REFRESH_MIN_MS),
    ).toBe(true);
  });

  it('mergeFocusResponse conserva foco previo en 304/notModified', () => {
    const prev = { dailyMood: { mood: 'calm' } };
    expect(mergeFocusResponse({ notModified: true }, prev)).toBe(prev);
  });

  it('mergeFocusResponse actualiza cuando hay data nueva', () => {
    const next = { dailyMood: { mood: 'good' } };
    expect(mergeFocusResponse({ success: true, data: next }, null)).toEqual(next);
  });
});
