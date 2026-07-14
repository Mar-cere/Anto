import {
  __resetDashboardSessionForTests,
  getDashboardSessionId,
  getMoodCheckInUiState,
  markMoodCheckInCollapsed,
  markMoodCheckInExpanded,
  shouldExpandMoodCheckInOnMount,
} from '../dashboardSession';

describe('dashboardSession', () => {
  beforeEach(() => {
    __resetDashboardSessionForTests();
  });

  it('getDashboardSessionId es estable en el proceso', () => {
    const a = getDashboardSessionId();
    const b = getDashboardSessionId();
    expect(a).toBe(b);
    expect(a).toMatch(/^dash-\d+$/);
  });

  it('sin ánimo siempre expande', () => {
    expect(
      shouldExpandMoodCheckInOnMount({
        hasMood: false,
        sessionId: 'dash-1',
        state: { sessionId: 'dash-1', collapsed: true },
      }),
    ).toBe(true);
  });

  it('nueva sesión con ánimo expande aunque estaba colapsado antes', () => {
    expect(
      shouldExpandMoodCheckInOnMount({
        hasMood: true,
        sessionId: 'dash-2',
        state: { sessionId: 'dash-1', collapsed: true },
      }),
    ).toBe(true);
  });

  it('misma sesión colapsada no re-expande', () => {
    expect(
      shouldExpandMoodCheckInOnMount({
        hasMood: true,
        sessionId: 'dash-1',
        state: { sessionId: 'dash-1', collapsed: true },
      }),
    ).toBe(false);
  });

  it('misma sesión expandida permanece expandida', () => {
    expect(
      shouldExpandMoodCheckInOnMount({
        hasMood: true,
        sessionId: 'dash-1',
        state: { sessionId: 'dash-1', collapsed: false },
      }),
    ).toBe(true);
  });

  it('mark collapsed / expanded persisten en memoria', () => {
    const sid = getDashboardSessionId();
    markMoodCheckInCollapsed();
    expect(getMoodCheckInUiState()).toEqual({ sessionId: sid, collapsed: true });
    markMoodCheckInExpanded();
    expect(getMoodCheckInUiState()).toEqual({ sessionId: sid, collapsed: false });
  });
});
