/**
 * Tests — plan semanal BA (#88)
 */
import {
  buildDefaultWeekPlanSlots,
  formatWeekStartKey,
  normalizeWeekPlanSlots,
  normalizeWeekStart,
} from '../../../services/behavioralActivationWeekPlanService.js';

describe('behavioralActivationWeekPlanService', () => {
  it('normalizeWeekStart alinea al lunes UTC', () => {
    const monday = normalizeWeekStart('2026-06-01');
    expect(formatWeekStartKey(monday)).toBe('2026-06-01');
    const wednesday = normalizeWeekStart('2026-06-03');
    expect(formatWeekStartKey(wednesday)).toBe('2026-06-01');
  });

  it('buildDefaultWeekPlanSlots genera 5 actividades en es', () => {
    const slots = buildDefaultWeekPlanSlots('es');
    expect(slots).toHaveLength(5);
    expect(slots.every((s) => s.status === 'planned')).toBe(true);
    expect(slots.every((s) => typeof s.slotId === 'string' && s.slotId.length > 0)).toBe(true);
  });

  it('buildDefaultWeekPlanSlots genera textos en en', () => {
    const slots = buildDefaultWeekPlanSlots('en');
    expect(slots[0].activityDescription).toMatch(/walk/i);
  });

  it('normalizeWeekPlanSlots elimina duplicados y limpia completedLogId', () => {
    const out = normalizeWeekPlanSlots([
      {
        slotId: 'a',
        dayOffset: 0,
        activityDescription: 'Paseo',
        activityType: 'pleasant',
        status: 'skipped',
        completedLogId: '507f1f77bcf86cd799439011',
      },
      {
        slotId: 'a',
        dayOffset: 1,
        activityDescription: 'Duplicado',
        activityType: 'pleasant',
        status: 'planned',
      },
      {
        slotId: 'b',
        dayOffset: 2,
        activityDescription: '  Ordenar  ',
        activityType: 'routine',
        status: 'completed',
        completedLogId: '507f1f77bcf86cd799439011',
      },
    ]);
    expect(out).toHaveLength(2);
    expect(out[0].completedLogId).toBeNull();
    expect(out[1].completedLogId).toBe('507f1f77bcf86cd799439011');
  });

  it('normalizeWeekPlanSlots conserva vínculos con tareas/hábitos', () => {
    const out = normalizeWeekPlanSlots([
      {
        slotId: 'a',
        dayOffset: 0,
        activityDescription: 'Paseo',
        activityType: 'pleasant',
        status: 'planned',
        linkedTaskId: '507f1f77bcf86cd799439011',
        linkedHabitId: null,
      },
    ]);
    expect(out[0].linkedTaskId).toBe('507f1f77bcf86cd799439011');
    expect(out[0].linkedHabitId).toBeNull();
  });
});
