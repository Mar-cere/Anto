/**
 * Tests — puente chat ↔ protocolos TCC (#6).
 */
import { jest } from '@jest/globals';

const mockFindWeekPlanForUser = jest.fn();
const mockExposureFindByUser = jest.fn();
const mockAbcFindByUser = jest.fn();

function normalizeWeekStart(input) {
  const d =
    input instanceof Date
      ? new Date(input.getTime())
      : new Date(String(input || '').trim() || Date.now());
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = utc.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  utc.setUTCDate(utc.getUTCDate() + diff);
  return utc;
}

await jest.unstable_mockModule('../../../services/behavioralActivationWeekPlanService.js', () => ({
  __esModule: true,
  findWeekPlanForUser: mockFindWeekPlanForUser,
  normalizeWeekStart,
}));

await jest.unstable_mockModule('../../../models/ExposurePlan.js', () => ({
  __esModule: true,
  default: { findByUser: mockExposureFindByUser },
}));

await jest.unstable_mockModule('../../../models/AbcRecord.js', () => ({
  __esModule: true,
  default: { findByUser: mockAbcFindByUser },
}));

const {
  buildActiveTccProtocolsPromptSnippet,
  getTodayDayOffsetInWeek,
  pickActiveExposureStep,
  pickBaFocusSlot,
  pickNextBaWeekSlot,
  summarizeRecentAbcRecord,
} = await import('../../../services/activeTccProtocolsContextService.js');

describe('activeTccProtocolsContextService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindWeekPlanForUser.mockResolvedValue(null);
    mockExposureFindByUser.mockResolvedValue([]);
    mockAbcFindByUser.mockResolvedValue([]);
  });

  it('getTodayDayOffsetInWeek devuelve el índice del día dentro de la semana del plan', () => {
    const monday = normalizeWeekStart(new Date('2026-06-04'));
    expect(getTodayDayOffsetInWeek(monday, new Date('2026-06-04T12:00:00'))).toBe(3);
    expect(getTodayDayOffsetInWeek(monday, new Date('2026-06-11T12:00:00'))).toBe(null);
  });

  it('pickBaFocusSlot prioriza la actividad de hoy', () => {
    const weekStart = normalizeWeekStart(new Date('2026-06-04'));
    const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const picked = pickBaFocusSlot({
      plan: {
        slots: [
          { slotId: 'a', dayOffset: 1, status: 'planned', activityDescription: 'Lunes pasado' },
          { slotId: 'b', dayOffset: 3, status: 'planned', activityDescription: 'Hoy toca' },
          { slotId: 'c', dayOffset: 5, status: 'planned', activityDescription: 'Sábado' },
        ],
      },
      weekStart,
      dayLabels,
      now: new Date('2026-06-04T12:00:00'),
    });
    expect(picked?.slotId).toBe('b');
    expect(picked?.isToday).toBe(true);
    expect(picked?.activityDescription).toBe('Hoy toca');
  });

  it('pickBaFocusSlot elige atrasada si no quedan días futuros en la semana', () => {
    const weekStart = normalizeWeekStart(new Date('2026-06-04'));
    const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const picked = pickBaFocusSlot({
      plan: {
        slots: [
          { slotId: 'a', dayOffset: 0, status: 'planned', activityDescription: 'Lunes atrasado' },
          { slotId: 'b', dayOffset: 1, status: 'completed', activityDescription: 'Hecha' },
        ],
      },
      weekStart,
      dayLabels,
      now: new Date('2026-06-04T12:00:00'),
    });
    expect(picked?.slotId).toBe('a');
    expect(picked?.isOverdue).toBe(true);
  });

  it('pickNextBaWeekSlot elige la pendiente más temprana', () => {
    const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const next = pickNextBaWeekSlot(
      {
        slots: [
          { dayOffset: 4, status: 'planned', activityDescription: 'Tardea' },
          { dayOffset: 1, status: 'planned', activityDescription: 'Temprana' },
          { dayOffset: 2, status: 'completed', activityDescription: 'Hecha' },
        ],
      },
      dayLabels,
    );
    expect(next?.activityDescription).toBe('Temprana');
    expect(next?.dayLabel).toBe('Mar');
    expect(next?.pendingCount).toBe(2);
  });

  it('pickActiveExposureStep prioriza in_progress', () => {
    const step = pickActiveExposureStep({
      steps: [
        { status: 'pending', description: 'A' },
        { status: 'in_progress', description: 'B' },
      ],
    });
    expect(step?.description).toBe('B');
  });

  it('pickActiveExposureStep devuelve null si todos completados', () => {
    const step = pickActiveExposureStep({
      steps: [
        { status: 'completed', description: 'A' },
        { status: 'completed', description: 'B' },
      ],
    });
    expect(step).toBeNull();
  });

  it('summarizeRecentAbcRecord trunca y limpia caracteres de control', () => {
    const summary = summarizeRecentAbcRecord({
      activatingEvent: 'Discutí con mi pareja\u0007 en la cena',
      beliefs: 'Siempre arruino todo',
    });
    expect(summary?.activatingEvent).toMatch(/Discutí/);
    expect(summary?.activatingEvent).not.toMatch(/\u0007/);
    expect(summary?.beliefs).toMatch(/arruino/);
  });

  it('summarizeRecentAbcRecord devuelve null sin contenido útil', () => {
    expect(summarizeRecentAbcRecord({ activatingEvent: '   ', beliefs: '' })).toBeNull();
  });

  it('buildActiveTccProtocolsPromptSnippet devuelve null sin userId', async () => {
    await expect(buildActiveTccProtocolsPromptSnippet({ userId: null })).resolves.toBeNull();
  });

  it('incluye ABC reciente en el snippet (máx. 3 líneas)', async () => {
    mockAbcFindByUser.mockResolvedValue([
      {
        activatingEvent: 'Reunión tensa con mi jefe',
        beliefs: 'Siempre me van a despedir',
      },
    ]);

    const snippet = await buildActiveTccProtocolsPromptSnippet({
      userId: '507f1f77bcf86cd799439011',
      language: 'es',
    });

    expect(snippet).toMatch(/Autorregistro ABC reciente/);
    expect(snippet).toMatch(/Reunión tensa/);
    expect(snippet).toMatch(/Herramientas TCC activas/);
    expect(snippet.split('\n').filter((l) => l.startsWith('- ')).length).toBeLessThanOrEqual(3);
  });

  it('incluye BA, exposición y ABC cuando hay tres fuentes (máx. 3 líneas)', async () => {
    mockFindWeekPlanForUser.mockResolvedValue({
      plan: {
        slots: [{ dayOffset: 0, status: 'planned', activityDescription: 'Caminar 10 min' }],
      },
      dayLabels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    });
    mockExposureFindByUser.mockResolvedValue([
      {
        title: 'Miedo social',
        steps: [{ status: 'in_progress', description: 'Saludar a un vecino' }],
      },
    ]);
    mockAbcFindByUser.mockResolvedValue([
      { activatingEvent: 'Evento ABC', beliefs: 'Pensamiento ABC' },
    ]);

    const snippet = await buildActiveTccProtocolsPromptSnippet({
      userId: '507f1f77bcf86cd799439011',
      language: 'es',
    });

    expect(snippet).toMatch(/Plan semanal/);
    expect(snippet).toMatch(/Jerarquía de exposición/);
    expect(snippet).toMatch(/Autorregistro ABC/);
    const protocolLines = snippet
      .split('\n')
      .filter((l) => l.startsWith('- ') && !l.includes('Puedes mencionarlos') && !l.includes('Invita a retomarlos'));
    expect(protocolLines).toHaveLength(3);
  });
});
