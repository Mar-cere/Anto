/**
 * Tests unitarios para configuración de Mercado Pago (planes ES/EN).
 */

import { jest } from '@jest/globals';

const ORIGINAL_ENV = { ...process.env };

const PREAPPROVAL_ENV_KEYS = [
  'MERCADOPAGO_PREAPPROVAL_PLAN_ID_MONTHLY',
  'MERCADOPAGO_PREAPPROVAL_PLAN_ID_QUARTERLY',
  'MERCADOPAGO_PREAPPROVAL_PLAN_ID_SEMESTRAL',
  'MERCADOPAGO_PREAPPROVAL_PLAN_ID_YEARLY',
  'ENG_MERCADOPAGO_PREAPPROVAL_PLAN_ID_MONTHLY',
  'ENG_MERCADOPAGO_PREAPPROVAL_PLAN_ID_QUARTERLY',
  'ENG_MERCADOPAGO_PREAPPROVAL_PLAN_ID_SEMESTRAL',
  'ENG_MERCADOPAGO_PREAPPROVAL_PLAN_ID_YEARLY',
];

function clearPreapprovalEnv() {
  for (const key of PREAPPROVAL_ENV_KEYS) {
    process.env[key] = '';
  }
}

describe('config/mercadopago', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    process.env.MERCADOPAGO_ACCESS_TOKEN = 'TEST-token';
    clearPreapprovalEnv();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('getPreapprovalPlanId resuelve plan ES y EN sin mezclar mapas', async () => {
    process.env.MERCADOPAGO_PREAPPROVAL_PLAN_ID_MONTHLY = 'plan-es-monthly';
    process.env.ENG_MERCADOPAGO_PREAPPROVAL_PLAN_ID_MONTHLY = 'plan-en-monthly';

    const { getPreapprovalPlanId } = await import('../../../config/mercadopago.js');

    expect(getPreapprovalPlanId('monthly', 'es')).toBe('plan-es-monthly');
    expect(getPreapprovalPlanId('monthly', 'en')).toBe('plan-en-monthly');
    expect(getPreapprovalPlanId('monthly', 'fr')).toBe('plan-es-monthly');
  });

  it('getPreapprovalPlanId no hace fallback silencioso de EN a ES', async () => {
    process.env.MERCADOPAGO_PREAPPROVAL_PLAN_ID_QUARTERLY = 'plan-es-quarterly';
    process.env.ENG_MERCADOPAGO_PREAPPROVAL_PLAN_ID_QUARTERLY = '';

    const { getPreapprovalPlanId } = await import('../../../config/mercadopago.js');

    expect(getPreapprovalPlanId('quarterly', 'es')).toBe('plan-es-quarterly');
    expect(getPreapprovalPlanId('quarterly', 'en')).toBeNull();
  });

  it('getPreapprovalPlanId rechaza planes inválidos y IDs vacíos', async () => {
    process.env.MERCADOPAGO_PREAPPROVAL_PLAN_ID_YEARLY = '   ';

    const { getPreapprovalPlanId } = await import('../../../config/mercadopago.js');

    expect(getPreapprovalPlanId('weekly', 'es')).toBeNull();
    expect(getPreapprovalPlanId('yearly', 'es')).toBeNull();
  });

  it('validatePreapprovalPlanIds reporta faltantes por idioma', async () => {
    process.env.MERCADOPAGO_PREAPPROVAL_PLAN_ID_MONTHLY = 'plan-es-monthly';
    process.env.MERCADOPAGO_PREAPPROVAL_PLAN_ID_QUARTERLY = 'plan-es-quarterly';
    process.env.MERCADOPAGO_PREAPPROVAL_PLAN_ID_SEMESTRAL = 'plan-es-semestral';
    process.env.MERCADOPAGO_PREAPPROVAL_PLAN_ID_YEARLY = 'plan-es-yearly';

    const { validatePreapprovalPlanIds } = await import('../../../config/mercadopago.js');
    const result = validatePreapprovalPlanIds({ warn: jest.fn() });

    expect(result.ok).toBe(false);
    expect(result.missing.some((item) => item.lang === 'en' && item.plan === 'monthly')).toBe(true);
    expect(result.missing.some((item) => item.envKey === 'ENG_MERCADOPAGO_PREAPPROVAL_PLAN_ID_MONTHLY')).toBe(true);
  });
});
