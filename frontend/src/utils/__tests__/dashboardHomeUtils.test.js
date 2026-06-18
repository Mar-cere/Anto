import {
  computeDashboardStreakDays,
  computeHabitsActiveThisWeek,
  getDashboardEyebrow,
  getDashboardDisplayName,
  getProfileInitial,
  pickAntoPromptFromFocus,
  formatHabitRowMeta,
  getActiveHabitsForDashboard,
} from '../dashboardHomeUtils';

describe('dashboardHomeUtils', () => {
  it('formatea el eyebrow del header en español', () => {
    const eyebrow = getDashboardEyebrow({
      language: 'es',
      date: new Date('2026-06-17T10:00:00'),
    });
    expect(eyebrow).toMatch(/MIÉRCOLES|MIERCOLES/i);
    expect(eyebrow).toContain('·');
  });

  it('formatea el eyebrow del header en inglés', () => {
    const eyebrow = getDashboardEyebrow({
      language: 'en',
      date: new Date('2026-06-17T10:00:00'),
    });
    expect(eyebrow).toMatch(/WEDNESDAY/i);
    expect(eyebrow).toContain('·');
  });

  it('obtiene nombre e inicial de perfil', () => {
    expect(getDashboardDisplayName({ name: 'Marcelo' })).toBe('Marcelo');
    expect(getProfileInitial({ name: 'Marcelo' })).toBe('M');
  });

  it('calcula racha y hábitos activos de la semana', () => {
    const habits = [
      { status: { archived: false, completedToday: true, lastCompleted: new Date().toISOString() }, progress: { streak: 3 } },
      { status: { archived: false, completedToday: false, lastCompleted: null }, progress: { streak: 0 } },
      { status: { archived: true, completedToday: true }, progress: { streak: 10 } },
    ];
    expect(computeDashboardStreakDays(habits)).toBe(3);
    expect(computeHabitsActiveThisWeek(habits)).toBe(1);
    expect(getActiveHabitsForDashboard(habits)).toHaveLength(2);
  });

  it('prioriza dailyMood para el prompt de Anto', () => {
    const prompt = pickAntoPromptFromFocus({
      dailyMood: {
        mood: 'anxious',
        antoSnippet: 'Puedo acompañarte ahora.',
        suggestChat: true,
      },
      reminder: { candidates: [{ title: 'Otro', subtitle: 'x', kind: 'chat' }] },
    });
    expect(prompt?.snippet).toBe('Puedo acompañarte ahora.');
    expect(prompt?.kind).toBe('daily_mood');
  });

  it('extrae prompt de Anto desde foco', () => {
    const prompt = pickAntoPromptFromFocus({
      reminder: {
        candidates: [{ title: 'Retoma', subtitle: 'Última charla', kind: 'chat', conversationId: 'abc' }],
      },
    });
    expect(prompt?.snippet).toBe('Última charla');
    expect(prompt?.conversationId).toBe('abc');
  });

  it('formatea meta de hábito pendiente', () => {
    const meta = formatHabitRowMeta(
      { status: { completedToday: false } },
      { HABIT_META_PENDING: 'Sin completar hoy', HABIT_META_COMPLETED_TODAY: 'x', HABIT_META_COMPLETED_STREAK: 'y' },
    );
    expect(meta).toBe('Sin completar hoy');
  });
});
