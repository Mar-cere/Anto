import {
  computeDashboardStreakDays,
  computeHabitsActiveThisWeek,
  getDashboardEyebrow,
  getDashboardDisplayName,
  getProfileInitial,
  buildStreakHeroCopy,
  buildMoodAckCopy,
  pickStableVariantIndex,
  formatHabitRowMeta,
  getActiveHabitsForDashboard,
  resolveDashboardStreakDays,
  getLastSessionDisplayText,
  hasDashboardChatContinuity,
  truncateFocusPreviewText,
} from '../dashboardHomeUtils';

const HERO_TEXTS_ES = {
  STREAK_HERO_ZERO_TITLE_0: 'Hola, {name}.',
  STREAK_HERO_ZERO_SUBTITLE_0: 'Estoy aquí cuando quieras hablar de cómo te sientes.',
  STREAK_HERO_ZERO_TITLE_1: '{name}, ¿cómo amaneció el día?',
  STREAK_HERO_ZERO_SUBTITLE_1: 'Si quieres, lo vemos juntos en el chat.',
  STREAK_HERO_ZERO_TITLE_2: '{name}, me dio gusto verte por aquí.',
  STREAK_HERO_ZERO_SUBTITLE_2: 'Cuéntame cómo te encuentras, sin apuro.',
  STREAK_HERO_MOOD_GOOD_TITLE_0: '{name}, me alegra que estés bien.',
  STREAK_HERO_MOOD_GOOD_SUBTITLE_0: '¿Quieres contarme qué está ayudando hoy?',
  STREAK_HERO_MOOD_GOOD_TITLE_1: '{name}, qué bueno leerte así.',
  STREAK_HERO_MOOD_GOOD_SUBTITLE_1: '¿Hay algo que quieras celebrar o sostener?',
  STREAK_HERO_MOOD_GOOD_TITLE_2: '{name}, hoy suena con buena energía.',
  STREAK_HERO_MOOD_GOOD_SUBTITLE_2: 'Podemos aprovechar ese impulso si te apetece.',
  STREAK_HERO_MOOD_GOOD_TITLE_3: '{name}, me gusta cómo llegas.',
  STREAK_HERO_MOOD_GOOD_SUBTITLE_3: '¿Qué te gustaría hacer con ese ánimo hoy?',
};

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

  it('resolveDashboardStreakDays prioriza engagementStreak del foco', () => {
    expect(resolveDashboardStreakDays({ engagementStreak: { current: 4 } }, [])).toBe(4);
    expect(resolveDashboardStreakDays(null, [{ status: {}, progress: { streak: 2 } }])).toBe(2);
  });

  it('formatea meta de hábito pendiente', () => {
    const meta = formatHabitRowMeta(
      { status: { completedToday: false } },
      { HABIT_META_PENDING: 'Sin completar hoy', HABIT_META_COMPLETED_TODAY: 'x', HABIT_META_COMPLETED_STREAK: 'y' },
    );
    expect(meta).toBe('Sin completar hoy');
  });

  it('personaliza el héroe con nombre y ánimo del día', () => {
    const copy = buildStreakHeroCopy({
      streakDays: 0,
      displayName: 'Marcelo Ull',
      dailyMood: { mood: 'good', dateKey: '2026-06-18' },
      texts: HERO_TEXTS_ES,
    });
    expect(copy.title).toContain('Marcelo');
    expect(copy.subtitle.length).toBeGreaterThan(10);
  });

  it('rota variantes del héroe según fecha y ánimo', () => {
    const seedA = buildStreakHeroCopy({
      streakDays: 0,
      displayName: 'Ana',
      dailyMood: { mood: 'good', dateKey: '2026-06-18' },
      texts: HERO_TEXTS_ES,
    });
    const seedB = buildStreakHeroCopy({
      streakDays: 0,
      displayName: 'Ana',
      dailyMood: { mood: 'good', dateKey: '2026-06-19' },
      texts: HERO_TEXTS_ES,
    });
    expect(pickStableVariantIndex('2026-06-18:good:0', 4)).not.toBe(
      pickStableVariantIndex('2026-06-19:good:0', 4),
    );
    expect([seedA.title, seedA.subtitle].join(' ')).not.toEqual([seedB.title, seedB.subtitle].join(' '));
  });

  it('usa saludo personal sin racha cuando no hay ánimo', () => {
    const copy = buildStreakHeroCopy({
      streakDays: 0,
      displayName: 'Marcelo',
      dailyMood: null,
      texts: HERO_TEXTS_ES,
    });
    expect(copy.title).toMatch(/Marcelo|Hola/);
    expect(copy.subtitle.length).toBeGreaterThan(10);
  });

  it('prioriza displaySubtitle y evita despedidas', () => {
    const summary = {
      snippet: 'Chau, cuídate. Cuando quieras volver, aquí estaré.',
      bridge: 'Chau, cuídate.',
      displaySubtitle: 'Tu conversación sigue en el chat, en privado. Retoma cuando quieras.',
      placeholder: false,
    };
    expect(getLastSessionDisplayText(summary)).toBe(summary.displaySubtitle);
    expect(hasDashboardChatContinuity(summary)).toBe(true);
  });

  it('prioriza bridge en placeholder para continuidad del chat', () => {
    const summary = {
      snippet: 'Resumen largo',
      bridge: 'Retomemos lo de ayer',
      placeholder: true,
    };
    expect(getLastSessionDisplayText(summary)).toBe('Retomemos lo de ayer');
    expect(hasDashboardChatContinuity(summary)).toBe(true);
  });

  it('no marca continuidad sin texto visible', () => {
    expect(hasDashboardChatContinuity(null)).toBe(false);
    expect(hasDashboardChatContinuity({ snippet: '  ', bridge: '' })).toBe(false);
  });

  it('recorta preview del foco en límite de palabra', () => {
    const long =
      'Has estado lidiando con problemas para dormir, especialmente al intentar conciliar el sueño tras un día exigente';
    const preview = truncateFocusPreviewText(long, 72);
    expect(preview.endsWith('…')).toBe(true);
    expect(preview.length).toBeLessThanOrEqual(73);
    expect(preview).not.toMatch(/concili…$/);
    expect(truncateFocusPreviewText('Corto', 72)).toBe('Corto');
  });

  it('genera reacción de ánimo para el check-in', () => {
    const ack = buildMoodAckCopy({
      mood: 'good',
      displayName: 'Marcelo',
      dateKey: '2026-06-19',
      texts: HERO_TEXTS_ES,
    });
    expect(ack?.line).toBeTruthy();
    expect(ack.line.length).toBeGreaterThan(10);
  });
});
