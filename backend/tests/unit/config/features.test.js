/**
 * Tests de feature flags centralizados.
 */

import { jest } from '@jest/globals';

const ORIGINAL_ENV = { ...process.env };

describe('config/features', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.ENABLE_WEEKLY_TIPS_EMAIL;
    delete process.env.ENABLE_WEEKLY_SUMMARY_EMAIL;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('por defecto activa flags que usan patrón !== "false" (excepto reminders, opt-in)', async () => {
    delete process.env.ENABLE_REMINDERS;
    delete process.env.ENABLE_CRISIS_FOLLOWUP;
    delete process.env.ENABLE_INTENSE_CHAT_CHECKIN;
    delete process.env.ENABLE_NOTIFICATION_SCHEDULER;
    delete process.env.ENABLE_OPENAI_DAILY_COST_REPORT;
    delete process.env.ENABLE_SOFT_LANDING_POST_CRISIS;
    const { features } = await import('../../../config/features.js');
    expect(features.reminders).toBe(false);
    expect(features.crisisFollowUp).toBe(true);
    expect(features.intenseChatCheckIn).toBe(true);
    expect(features.notificationScheduler).toBe(true);
    expect(features.openaiDailyCostReport).toBe(true);
    expect(features.weeklySummaryEmail).toBe(false);
    expect(features.softLandingPostCrisis).toBe(true);
  });

  it('ENABLE_WEEKLY_SUMMARY_EMAIL=true activa correo de resumen semanal', async () => {
    process.env.ENABLE_WEEKLY_SUMMARY_EMAIL = 'true';
    const { features } = await import('../../../config/features.js');
    expect(features.weeklySummaryEmail).toBe(true);
  });

  it('ENABLE_WEEKLY_TIPS_EMAIL=true sigue activando el correo semanal (compatibilidad)', async () => {
    process.env.ENABLE_WEEKLY_TIPS_EMAIL = 'true';
    const { features } = await import('../../../config/features.js');
    expect(features.weeklySummaryEmail).toBe(true);
  });

  it('ENABLE_REMINDERS=true activa recordatorios por correo de contactos de emergencia', async () => {
    process.env.ENABLE_REMINDERS = 'true';
    const { features } = await import('../../../config/features.js');
    expect(features.reminders).toBe(true);
  });

  it('ENABLE_*=false desactiva el flag correspondiente', async () => {
    process.env.ENABLE_CRISIS_FOLLOWUP = 'false';
    process.env.ENABLE_OPENAI_DAILY_COST_REPORT = 'false';
    process.env.ENABLE_SOFT_LANDING_POST_CRISIS = 'false';
    const { features } = await import('../../../config/features.js');
    expect(features.crisisFollowUp).toBe(false);
    expect(features.openaiDailyCostReport).toBe(false);
    expect(features.softLandingPostCrisis).toBe(false);
  });

  it('swagger en desarrollo sin ENABLE_SWAGGER', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.ENABLE_SWAGGER;
    const { features } = await import('../../../config/features.js');
    expect(features.swagger).toBe(true);
  });

  it('swagger en producción solo con ENABLE_SWAGGER=true', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ENABLE_SWAGGER = 'false';
    const { features: off } = await import('../../../config/features.js');
    expect(off.swagger).toBe(false);

    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    process.env.NODE_ENV = 'production';
    process.env.ENABLE_SWAGGER = 'true';
    const { features: on } = await import('../../../config/features.js');
    expect(on.swagger).toBe(true);
  });
});
