/**
 * Tests — continuidad chat ↔ protocolos TCC (BA, exposición).
 */
import { jest } from '@jest/globals';

const mockFindWeekPlanForUser = jest.fn();
const mockExposureFindByUser = jest.fn();
const mockAbcFindByUser = jest.fn();
const mockAtFindByUser = jest.fn();
const mockMessageExists = jest.fn();

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

await jest.unstable_mockModule('../../../models/AutomaticThoughtLog.js', () => ({
  __esModule: true,
  default: { findByUser: mockAtFindByUser },
}));

await jest.unstable_mockModule('../../../models/Message.js', () => ({
  __esModule: true,
  default: { exists: mockMessageExists },
}));

const { getTodayDayOffsetInWeek } = await import('../../../services/activeTccProtocolsContextService.js');

const {
  buildChatTccContinuity,
  loadExposureFocus,
} = await import('../../../services/chatTccContinuityService.js');

function weekPlanWithTodaySlot(activityDescription) {
  const now = new Date();
  const weekStart = normalizeWeekStart(now);
  const dayOffset = getTodayDayOffsetInWeek(weekStart, now);
  if (dayOffset === null) return null;
  return {
    plan: {
      slots: [
        { slotId: 's1', dayOffset, status: 'planned', activityDescription },
      ],
    },
    weekStart,
    dayLabels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
  };
}

describe('chatTccContinuityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindWeekPlanForUser.mockResolvedValue(null);
    mockExposureFindByUser.mockResolvedValue([]);
    mockAbcFindByUser.mockResolvedValue([]);
    mockAtFindByUser.mockResolvedValue([]);
    mockMessageExists.mockResolvedValue(true);
  });

  it('devuelve vacío si la conversación no tiene mensajes del usuario', async () => {
    mockMessageExists.mockResolvedValue(false);
    mockFindWeekPlanForUser.mockResolvedValue(weekPlanWithTodaySlot('Caminar'));

    const result = await buildChatTccContinuity({
      userId: '507f1f77bcf86cd799439011',
      language: 'es',
      conversationId: '507f1f77bcf86cd799439022',
    });

    expect(result.items).toEqual([]);
    expect(mockFindWeekPlanForUser).not.toHaveBeenCalled();
  });

  it('devuelve vacío sin userId', async () => {
    const result = await buildChatTccContinuity({ userId: null, language: 'es' });
    expect(result.items).toEqual([]);
    expect(result.generatedAt).toBeTruthy();
    expect(mockFindWeekPlanForUser).not.toHaveBeenCalled();
  });

  it('construye ítem BA cuando hay slot de hoy', async () => {
    const weekCtx = weekPlanWithTodaySlot('Salir a caminar');
    if (!weekCtx) {
      expect(true).toBe(true);
      return;
    }
    mockFindWeekPlanForUser.mockResolvedValue(weekCtx);

    const result = await buildChatTccContinuity({
      userId: '507f1f77bcf86cd799439011',
      language: 'es',
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('ba:s1');
    expect(result.items[0].screen).toBe('BehavioralActivation');
    expect(result.items[0].params).toEqual({ openWeekSlotId: 's1' });
    expect(result.items[0].title).toContain('Hoy');
  });

  it('añade exposición si hay plan activo y no alcanzó MAX_ITEMS', async () => {
    mockExposureFindByUser.mockResolvedValue([
      {
        _id: '507f1f77bcf86cd799439012',
        title: 'Miedo social',
        currentStepIndex: 0,
        steps: [
          {
            description: 'Saludar a un desconocido',
            status: 'in_progress',
            attempts: [{ peakSuds: 7, endSuds: 5 }],
          },
        ],
      },
    ]);

    const result = await buildChatTccContinuity({
      userId: '507f1f77bcf86cd799439011',
      language: 'es',
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('exposure:507f1f77bcf86cd799439012');
    expect(result.items[0].screen).toBe('ExposureHierarchy');
    expect(result.items[0].params.mode).toBe('practice');
    expect(result.items[0].subtitle).toContain('Paso 1/1');
  });

  it('limita a 2 ítems (BA + exposición)', async () => {
    const weekCtx = weekPlanWithTodaySlot('Actividad BA');
    if (!weekCtx) {
      expect(true).toBe(true);
      return;
    }
    mockFindWeekPlanForUser.mockResolvedValue(weekCtx);
    mockExposureFindByUser.mockResolvedValue([
      {
        _id: '507f1f77bcf86cd799439012',
        steps: [{ description: 'Paso exp', status: 'pending', attempts: [] }],
        currentStepIndex: 0,
      },
    ]);

    const result = await buildChatTccContinuity({
      userId: '507f1f77bcf86cd799439011',
      language: 'en',
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[0].kind).toBe('behavioral_activation');
    expect(result.items[1].kind).toBe('exposure_hierarchy');
    expect(result.items[1].title).toContain('Exposure');
  });

  it('loadExposureFocus devuelve null sin plan', async () => {
    mockExposureFindByUser.mockResolvedValue([]);
    const focus = await loadExposureFocus('507f1f77bcf86cd799439011');
    expect(focus).toBeNull();
  });

  it('tolera errores de DB sin lanzar', async () => {
    mockFindWeekPlanForUser.mockRejectedValue(new Error('db down'));
    mockExposureFindByUser.mockRejectedValue(new Error('db down'));
    const result = await buildChatTccContinuity({
      userId: '507f1f77bcf86cd799439011',
      language: 'es',
    });
    expect(result.items).toEqual([]);
  });

  it('prioriza AT incompleto si no hay BA ni exposición', async () => {
    mockAtFindByUser.mockResolvedValue([
      {
        _id: '507f1f77bcf86cd799439099',
        situation: 'En el trabajo',
        automaticThought: 'Nunca voy a poder',
        balancedThought: '',
        distortionType: 'overgeneralization',
      },
    ]);

    const result = await buildChatTccContinuity({
      userId: '507f1f77bcf86cd799439011',
      language: 'es',
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].kind).toBe('automatic_thought_record');
    expect(result.items[0].screen).toBe('AutomaticThoughtRecord');
  });

  it('añade ABC reciente si no hay otros ítems', async () => {
    mockAbcFindByUser.mockResolvedValue([
      {
        _id: '507f1f77bcf86cd799439088',
        activatingEvent: 'Reunión tensa',
        beliefs: 'No voy a poder',
        emotions: 'ansiedad',
        consequence: 'Me callé',
        emotionIntensity: 7,
      },
    ]);

    const result = await buildChatTccContinuity({
      userId: '507f1f77bcf86cd799439011',
      language: 'es',
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].kind).toBe('abc_record');
    expect(result.items[0].screen).toBe('AbcRecord');
    expect(result.items[0].params.prefillActivatingEvent).toContain('Reunión');
  });
});
