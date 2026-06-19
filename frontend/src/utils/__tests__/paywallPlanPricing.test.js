import {
  computePaywallPlanPricing,
  formatPlanMoney,
  PLAN_BILLING_MONTHS,
} from '../paywallPlanPricing';
import {
  buildPaywallMemoryCopy,
  inferFirstCheckInToday,
} from '../paywallMemoryCopy';

describe('paywallPlanPricing', () => {
  const monthly = { id: 'monthly', amount: 3990, formattedAmount: '$3.990', currency: 'CLP' };
  const yearly = { id: 'yearly', amount: 39990, formattedAmount: '$39.990', currency: 'CLP' };
  const quarterly = { id: 'quarterly', amount: 11990, formattedAmount: '$11.990', currency: 'CLP' };

  it('calcula precio por mes y ahorro vs mensual', () => {
    const pricing = computePaywallPlanPricing(yearly, monthly);
    expect(PLAN_BILLING_MONTHS.yearly).toBe(12);
    expect(pricing.perMonth).toBeCloseTo(39990 / 12, 1);
    expect(pricing.monthlyReference).toBe(3990);
    expect(pricing.percentSave).toBeGreaterThan(0);
    expect(formatPlanMoney(3990, 'CLP')).toContain('3');
  });

  it('expone formattedPerMonth para UI del paywall', () => {
    const pricing = computePaywallPlanPricing(yearly, monthly);
    expect(pricing.formattedPerMonth).toBeTruthy();
    expect(pricing.formattedMonthlyReference).toBe('$3.990');
  });

  it('calcula trimestre en 3 meses', () => {
    const pricing = computePaywallPlanPricing(quarterly, monthly);
    expect(pricing.months).toBe(3);
    expect(pricing.perMonth).toBeCloseTo(11990 / 3, 1);
  });
});

describe('paywallMemoryCopy', () => {
  const texts = {
    PAYWALL_MEMORY_TODAY_PREFIX: 'Hoy ',
    PAYWALL_MEMORY_FIRST_CHECKIN: 'completaste tu primer check-in',
    PAYWALL_MEMORY_CHECKIN_TODAY: 'completaste tu check-in',
    PAYWALL_MEMORY_HABITS_ONE: 'empezaste 1 hábito nuevo',
    PAYWALL_MEMORY_HABITS_MANY: 'empezaste {count} hábitos nuevos',
    PAYWALL_MEMORY_TASKS_ONE: 'completaste 1 tarea',
    PAYWALL_MEMORY_TASKS_MANY: 'completaste {count} tareas',
    PAYWALL_MEMORY_CHAT_ONE: 'enviaste 1 mensaje en el chat',
    PAYWALL_MEMORY_CHAT_MANY: 'enviaste {count} mensajes en el chat',
    PAYWALL_MEMORY_JOINER: ' y ',
    PAYWALL_MEMORY_OUTRO: 'Eso no se pierde.',
    PAYWALL_MEMORY_FALLBACK: 'Fallback',
  };

  it('combina check-in y hábitos con énfasis', () => {
    const copy = buildPaywallMemoryCopy(
      {
        hasCheckIn: true,
        isFirstCheckIn: true,
        habitsStartedToday: 2,
        tasksCompletedToday: 0,
        chatMessagesToday: 0,
      },
      texts,
    );
    expect(copy.lead).toContain('**completaste tu primer check-in**');
    expect(copy.lead).toContain('**empezaste 2 hábitos nuevos**');
  });

  it('usa fallback si no hay actividad del día', () => {
    const copy = buildPaywallMemoryCopy(
      {
        hasCheckIn: false,
        habitsStartedToday: 0,
        tasksCompletedToday: 0,
        chatMessagesToday: 0,
      },
      texts,
    );
    expect(copy.lead).toBe('Fallback');
  });

  it('usa fallback si stats es null', () => {
    const copy = buildPaywallMemoryCopy(null, texts);
    expect(copy.lead).toBe('Fallback');
  });

  it('inferFirstCheckInToday solo con check-in aislado', () => {
    expect(
      inferFirstCheckInToday({
        hasCheckIn: true,
        habitsStartedToday: 0,
        tasksCompletedToday: 0,
        chatMessagesToday: 0,
      }),
    ).toBe(true);
    expect(
      inferFirstCheckInToday({
        hasCheckIn: true,
        habitsStartedToday: 1,
        tasksCompletedToday: 0,
        chatMessagesToday: 0,
      }),
    ).toBe(false);
  });
});
