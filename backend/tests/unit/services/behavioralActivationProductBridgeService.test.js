/**
 * Tests — puente BA ↔ tareas/hábitos (fases 1–2).
 */
import { jest } from '@jest/globals';

const mockTaskFindOne = jest.fn();
const mockTaskCreate = jest.fn();
const mockTaskUpdateOne = jest.fn();
const mockHabitFindOne = jest.fn();
const mockHabitCreate = jest.fn();
const mockHabitUpdateOne = jest.fn();
const mockPlanFindOne = jest.fn();
const mockPlanFindById = jest.fn();
const mockPlanUpdateOne = jest.fn();

const planId = '507f1f77bcf86cd799439011';
const userId = '507f1f77bcf86cd799439012';
const slotId = 'slot-a';
const logId = '507f1f77bcf86cd799439013';

const baseSlot = {
  slotId,
  dayOffset: 2,
  activityDescription: 'Paseo corto al aire libre',
  activityType: 'pleasant',
  status: 'planned',
  completedLogId: null,
  linkedTaskId: null,
  linkedHabitId: null,
};

await jest.unstable_mockModule('../../../models/Task.js', () => ({
  __esModule: true,
  default: {
    findOne: mockTaskFindOne,
    create: mockTaskCreate,
    updateOne: mockTaskUpdateOne,
    findById: jest.fn(),
  },
}));

await jest.unstable_mockModule('../../../models/Habit.js', () => ({
  __esModule: true,
  default: {
    findOne: mockHabitFindOne,
    create: mockHabitCreate,
    updateOne: mockHabitUpdateOne,
    findById: jest.fn(),
    isSameLocalDay(left, right) {
      const a = new Date(left);
      const b = new Date(right);
      return a.toDateString() === b.toDateString();
    },
  },
}));

await jest.unstable_mockModule('../../../models/BehavioralActivationWeekPlan.js', () => ({
  __esModule: true,
  default: {
    findOne: mockPlanFindOne,
    findById: mockPlanFindById,
    updateOne: mockPlanUpdateOne,
  },
}));

const {
  buildHabitDraftFromBaSlot,
  buildTaskDraftFromBaSlot,
  computeSlotDueDate,
  inferHabitIcon,
  linkBaSlotToProduct,
  suggestProductKindForSlot,
  syncBaEcosystemFromLog,
  syncBaSlotFromProductCompletion,
  reconcileWeekPlanWithLinkedProducts,
} = await import('../../../services/behavioralActivationProductBridgeService.js');
const { normalizeWeekStart } = await import(
  '../../../services/behavioralActivationWeekPlanService.js'
);

describe('behavioralActivationProductBridgeService', () => {
  const weekStart = normalizeWeekStart(new Date('2026-06-02'));

  beforeEach(() => {
    jest.clearAllMocks();
    mockPlanUpdateOne.mockResolvedValue({ modifiedCount: 1 });
  });

  it('suggestProductKindForSlot distingue rutina y placentera', () => {
    expect(suggestProductKindForSlot({ activityType: 'routine' })).toBe('habit');
    expect(suggestProductKindForSlot({ activityType: 'pleasant' })).toBe('task');
  });

  it('buildTaskDraftFromBaSlot incluye título y fecha', () => {
    const draft = buildTaskDraftFromBaSlot({
      slot: { activityDescription: 'Paseo corto', dayOffset: 2, activityType: 'pleasant' },
      weekStart,
    });
    expect(draft.title).toMatch(/Paseo/);
    expect(draft.itemType).toBe('task');
    expect(draft.dueDate).toBeInstanceOf(Date);
    expect(draft.tags).toEqual(['ba']);
    expect(draft.tags[0].length).toBeLessThanOrEqual(20);
    expect(draft.category).toBe('Bienestar');
  });

  it('buildTaskDraftFromBaSlot usa copy EN', () => {
    const draft = buildTaskDraftFromBaSlot({
      slot: { activityDescription: 'x', dayOffset: 2, activityType: 'pleasant' },
      weekStart,
      language: 'en',
    });
    expect(draft.category).toBe('Wellbeing');
    expect(draft.title).toBe('BA activity');
  });

  it('buildHabitDraftFromBaSlot usa frecuencia semanal', () => {
    const draft = buildHabitDraftFromBaSlot({
      slot: { activityDescription: 'Ordenar un rincón', dayOffset: 1, activityType: 'routine' },
      weekStart,
    });
    expect(draft.frequency).toBe('weekly');
    expect(draft.reminder.enabled).toBe(true);
  });

  it('computeSlotDueDate no devuelve fecha pasada', () => {
    const due = computeSlotDueDate(weekStart, 0);
    expect(due.getTime()).toBeGreaterThan(Date.now());
  });

  it('computeSlotDueDate agenda días pasados en la misma semana para la semana siguiente', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-04T12:00:00')); // miércoles; lunes de esa semana ya pasó
    try {
      const planMonday = normalizeWeekStart(new Date('2026-06-04'));
      const due = computeSlotDueDate(planMonday, 0);
      expect(due.getHours()).toBe(18);
      const expected = new Date(planMonday.getTime());
      expected.setUTCDate(expected.getUTCDate() + 7);
      expected.setHours(18, 0, 0, 0);
      expect(due.getTime()).toBe(expected.getTime());
      expect(due.getTime()).toBeGreaterThan(Date.now());
    } finally {
      jest.useRealTimers();
    }
  });

  it('computeSlotDueDate conserva el día futuro de la semana actual', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-04T12:00:00')); // miércoles
    try {
      const planMonday = normalizeWeekStart(new Date('2026-06-04'));
      const due = computeSlotDueDate(planMonday, 4); // viernes de la misma semana
      const expected = new Date(planMonday.getTime());
      expected.setUTCDate(expected.getUTCDate() + 4);
      expected.setHours(18, 0, 0, 0);
      expect(due.getTime()).toBe(expected.getTime());
    } finally {
      jest.useRealTimers();
    }
  });

  it('inferHabitIcon reconoce paseo y comida', () => {
    expect(inferHabitIcon('Paseo al aire libre')).toBe('exercise');
    expect(inferHabitIcon('Preparar una comida sencilla')).toBe('diet');
  });

  it('linkBaSlotToProduct rechaza conflicto tarea+hábito en el mismo slot', async () => {
    mockPlanFindOne.mockResolvedValue({
      _id: planId,
      slots: [{ ...baseSlot, linkedHabitId: '507f1f77bcf86cd799439099' }],
      toObject: () => ({ _id: planId }),
    });

    await expect(
      linkBaSlotToProduct({
        userId,
        weekStartInput: weekStart,
        slotId,
        productKind: 'task',
      }),
    ).rejects.toMatchObject({ code: 'SLOT_LINK_CONFLICT' });
  });

  it('syncBaSlotFromProductCompletion marca slot al completar tarea vinculada', async () => {
    mockTaskFindOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439020',
          status: 'completed',
          baOrigin: { weekPlanId: planId, slotId },
        }),
      }),
    });
    mockPlanFindById
      .mockResolvedValueOnce({ _id: planId, slots: [{ ...baseSlot }] })
      .mockImplementationOnce(() => ({
        lean: jest.fn().mockResolvedValue({
          _id: planId,
          slots: [{ ...baseSlot, status: 'completed' }],
        }),
      }));

    const result = await syncBaSlotFromProductCompletion({
      userId,
      taskId: '507f1f77bcf86cd799439020',
    });

    expect(result?.updated).toBe(true);
    expect(mockPlanUpdateOne).toHaveBeenCalled();
  });

  it('reconcileWeekPlanWithLinkedProducts marca slot si el hábito se completó el día del slot', async () => {
    const linkedHabitId = '507f1f77bcf86cd799439021';
    const slotDay = new Date(weekStart);
    slotDay.setDate(slotDay.getDate() + baseSlot.dayOffset);
    mockHabitFindOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          status: { completedToday: false, lastCompleted: slotDay },
        }),
      }),
    });
    mockPlanFindById.mockImplementation(() => ({
      lean: jest.fn().mockResolvedValue({
        _id: planId,
        slots: [{ ...baseSlot, linkedHabitId, status: 'completed' }],
      }),
    }));

    const result = await reconcileWeekPlanWithLinkedProducts({
      userId,
      plan: { _id: planId, weekStart, slots: [{ ...baseSlot, linkedHabitId }] },
    });

    expect(result.updated).toBe(true);
    expect(mockPlanUpdateOne).toHaveBeenCalled();
  });

  it('reconcileWeekPlanWithLinkedProducts marca slot si la tarea vinculada ya está hecha', async () => {
    const linkedTaskId = '507f1f77bcf86cd799439020';
    mockTaskFindOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ status: 'completed' }),
      }),
    });
    mockPlanFindById.mockImplementation(() => ({
      lean: jest.fn().mockResolvedValue({
        _id: planId,
        slots: [{ ...baseSlot, linkedTaskId, status: 'completed' }],
      }),
    }));

    const result = await reconcileWeekPlanWithLinkedProducts({
      userId,
      plan: { _id: planId, slots: [{ ...baseSlot, linkedTaskId }] },
    });

    expect(result.updated).toBe(true);
    expect(mockPlanUpdateOne).toHaveBeenCalled();
  });

  it('syncBaEcosystemFromLog sincroniza producto vinculado existente', async () => {
    const linkedTaskId = '507f1f77bcf86cd799439020';
    mockPlanFindOne.mockResolvedValue({
      _id: planId,
      slots: [{ ...baseSlot, linkedTaskId }],
    });
    mockTaskFindOne.mockResolvedValue({
      _id: linkedTaskId,
      status: 'pending',
      markAsCompleted: jest.fn().mockResolvedValue(undefined),
    });
    mockPlanFindById.mockImplementation(() => ({
      lean: jest.fn().mockResolvedValue({
        _id: planId,
        slots: [{ ...baseSlot, linkedTaskId, status: 'completed' }],
      }),
    }));

    const result = await syncBaEcosystemFromLog({
      userId,
      weekStartInput: weekStart,
      slotId,
      logId,
    });

    expect(result?.plan).toBeTruthy();
    expect(mockPlanUpdateOne).toHaveBeenCalled();
  });
});
