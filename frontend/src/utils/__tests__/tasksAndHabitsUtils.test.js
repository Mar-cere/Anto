import {
  buildUnifiedTaskSections,
  computeHabitsTodayProgress,
  computeTasksSummaryCounts,
  filterHabitsByFrequency,
  hasAntoOrigin,
} from '../tasksAndHabitsUtils';

describe('tasksAndHabitsUtils', () => {
  describe('hasAntoOrigin', () => {
    it('detecta chatOrigin y baOrigin', () => {
      expect(hasAntoOrigin({ chatOrigin: { source: 'chat_v1' } })).toBe(true);
      expect(hasAntoOrigin({ baOrigin: { source: 'ba_week_plan_v1' } })).toBe(true);
      expect(hasAntoOrigin({ title: 'x' })).toBe(false);
    });
  });

  describe('filterHabitsByFrequency', () => {
    const habits = [
      { _id: '1', frequency: 'daily' },
      { _id: '2', frequency: 'weekly' },
      { _id: '3' },
    ];

    it('filtra diarios por defecto implícito', () => {
      const daily = filterHabitsByFrequency(habits, 'daily');
      expect(daily.map((h) => h._id)).toEqual(['1', '3']);
    });

    it('devuelve todos con all', () => {
      expect(filterHabitsByFrequency(habits, 'all')).toHaveLength(3);
    });
  });

  describe('computeHabitsTodayProgress', () => {
    it('calcula progreso y racha máxima', () => {
      const out = computeHabitsTodayProgress([
        { status: { completedToday: true }, progress: { streak: 3 } },
        { status: { completedToday: false }, progress: { streak: 7 } },
      ]);
      expect(out).toEqual({
        total: 2,
        completed: 1,
        pending: 1,
        maxStreak: 7,
        progress: 0.5,
      });
    });
  });

  describe('buildUnifiedTaskSections', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date('2026-06-17T12:00:00'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('agrupa hoy y requieren atención', () => {
      const items = [
        {
          _id: 'a',
          completed: false,
          dueDate: new Date('2026-06-17T14:00:00').toISOString(),
        },
        {
          _id: 'b',
          completed: false,
          dueDate: new Date('2026-06-10T14:00:00').toISOString(),
        },
      ];
      const sections = buildUnifiedTaskSections(items, {
        today: 'Hoy',
        attention: 'Atención',
      });
      expect(sections.map((s) => s.key)).toEqual(['today', 'attention']);
      expect(sections[0].data).toHaveLength(1);
      expect(sections[1].data).toHaveLength(1);
      expect(sections[1].tone).toBe('attention');
      expect(computeTasksSummaryCounts(items)).toEqual({
        todayCount: 1,
        upcomingCount: 0,
        attentionCount: 1,
      });
    });
  });
});
