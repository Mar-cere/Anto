import { describe, it, expect } from '@jest/globals';
import { buildWeeklySummaryAppHref } from '../../../config/mailer.js';

describe('buildWeeklySummaryAppHref', () => {
  it('prioriza WEEKLY_SUMMARY_EMAIL_APP_LINK', () => {
    const href = buildWeeklySummaryAppHref({
      WEEKLY_SUMMARY_EMAIL_APP_LINK: 'anto://weekly-summary',
      WEEKLY_SUMMARY_EMAIL_OPEN_APP_ONLY: 'true',
    });
    expect(href).toBe('anto://weekly-summary');
  });

  it('con OPEN_APP_ONLY usa esquema anto por defecto', () => {
    expect(
      buildWeeklySummaryAppHref({
        WEEKLY_SUMMARY_EMAIL_OPEN_APP_ONLY: 'true',
      })
    ).toBe('anto://');
  });

  it('con OPEN_APP_ONLY y path opcional', () => {
    expect(
      buildWeeklySummaryAppHref({
        WEEKLY_SUMMARY_EMAIL_OPEN_APP_ONLY: 'true',
        WEEKLY_SUMMARY_APP_PATH: '/weekly-summary',
      })
    ).toBe('anto://weekly-summary');
  });

  it('sin flags usa FRONTEND_URL + path', () => {
    const href = buildWeeklySummaryAppHref({
      FRONTEND_URL: 'https://app.example.com',
      WEEKLY_SUMMARY_EMAIL_LINK_PATH: '/home',
    });
    expect(href).toBe('https://app.example.com/home');
  });
});
