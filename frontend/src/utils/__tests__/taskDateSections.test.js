import { buildTaskSections, bucketTaskItem } from '../taskDateSections';

describe('taskDateSections', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-17T12:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('bucketTaskItem marca vencidas como overdue', () => {
    expect(
      bucketTaskItem({
        completed: false,
        dueDate: new Date('2026-06-10T12:00:00').toISOString(),
      }),
    ).toBe('overdue');
  });

  it('buildTaskSections usa título de atención para vencidas', () => {
    const sections = buildTaskSections(
      [
        {
          _id: '1',
          completed: false,
          dueDate: new Date('2026-06-10T12:00:00').toISOString(),
        },
      ],
      { overdue: 'Requieren atención', today: 'Hoy' },
    );
    expect(sections).toHaveLength(1);
    expect(sections[0].key).toBe('overdue');
    expect(sections[0].title).toBe('Requieren atención');
    expect(sections[0].tone).toBe('attention');
  });

  it('no incluye sección vencidas sin ítems', () => {
    const sections = buildTaskSections(
      [
        {
          _id: '2',
          completed: false,
          dueDate: new Date('2026-06-17T18:00:00').toISOString(),
        },
      ],
      { overdue: 'Requieren atención' },
    );
    expect(sections.map((s) => s.key)).toEqual(['today']);
  });
});
