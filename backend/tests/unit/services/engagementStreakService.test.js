import {
  applyEngagementSignalForTest,
  previousDateKey,
} from '../../../services/engagementStreakService.js';
import { ENGAGEMENT_SIGNAL } from '../../../utils/engagementStreakWeights.js';

describe('engagementStreakService', () => {
  it('chat solo califica el día', () => {
    const out = applyEngagementSignalForTest({}, ENGAGEMENT_SIGNAL.CHAT_USER_MESSAGE, '2026-06-17');
    expect(out.current).toBe(1);
    expect(out.lastQualifiedDateKey).toBe('2026-06-17');
    expect(out.todayPoints).toBe(1);
  });

  it('tarea + hábito califican sin chat', () => {
    let state = applyEngagementSignalForTest({}, ENGAGEMENT_SIGNAL.TASK_COMPLETED, '2026-06-17');
    expect(state.current).toBe(0);
    state = applyEngagementSignalForTest(state, ENGAGEMENT_SIGNAL.HABIT_COMPLETED, '2026-06-17');
    expect(state.current).toBe(1);
    expect(state.todaySignals).toEqual([
      ENGAGEMENT_SIGNAL.TASK_COMPLETED,
      ENGAGEMENT_SIGNAL.HABIT_COMPLETED,
    ]);
  });

  it('días consecutivos incrementan la racha', () => {
    const day1 = applyEngagementSignalForTest({}, ENGAGEMENT_SIGNAL.CHAT_USER_MESSAGE, '2026-06-16');
    const day2 = applyEngagementSignalForTest(day1, ENGAGEMENT_SIGNAL.CHAT_USER_MESSAGE, '2026-06-17');
    expect(day2.current).toBe(2);
    expect(day2.best).toBe(2);
  });

  it('hueco de un día reinicia la racha', () => {
    const day1 = applyEngagementSignalForTest({}, ENGAGEMENT_SIGNAL.CHAT_USER_MESSAGE, '2026-06-15');
    const day3 = applyEngagementSignalForTest(day1, ENGAGEMENT_SIGNAL.CHAT_USER_MESSAGE, '2026-06-17');
    expect(day3.current).toBe(1);
  });

  it('no duplica la misma señal el mismo día', () => {
    let state = applyEngagementSignalForTest({}, ENGAGEMENT_SIGNAL.CHAT_USER_MESSAGE, '2026-06-17');
    state = applyEngagementSignalForTest(state, ENGAGEMENT_SIGNAL.CHAT_USER_MESSAGE, '2026-06-17');
    expect(state.todaySignals).toEqual([ENGAGEMENT_SIGNAL.CHAT_USER_MESSAGE]);
    expect(state.current).toBe(1);
  });

  it('previousDateKey retrocede un día', () => {
    expect(previousDateKey('2026-06-17')).toBe('2026-06-16');
  });
});
