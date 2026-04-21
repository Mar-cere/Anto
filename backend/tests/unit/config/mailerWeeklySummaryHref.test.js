import { describe, it, expect } from '@jest/globals';
import { buildEmailAppOpenHref, buildWeeklySummaryAppHref } from '../../../config/mailer.js';

describe('buildEmailAppOpenHref', () => {
  it('prioriza EMAIL_APP_OPEN_LINK sobre WEEKLY_SUMMARY_EMAIL_APP_LINK', () => {
    const href = buildEmailAppOpenHref({
      EMAIL_APP_OPEN_LINK: 'https://open.example.com/thanks',
      WEEKLY_SUMMARY_EMAIL_APP_LINK: 'anto://weekly-summary',
      WEEKLY_SUMMARY_EMAIL_OPEN_APP_ONLY: 'true',
    });
    expect(href).toBe('https://open.example.com/thanks');
  });

  it('prioriza WEEKLY_SUMMARY_EMAIL_APP_LINK cuando no hay EMAIL_APP_OPEN_LINK', () => {
    const href = buildEmailAppOpenHref({
      WEEKLY_SUMMARY_EMAIL_APP_LINK: 'anto://weekly-summary',
      WEEKLY_SUMMARY_EMAIL_OPEN_APP_ONLY: 'true',
    });
    expect(href).toBe('anto://weekly-summary');
  });

  it('con OPEN_APP_ONLY usa esquema anto por defecto', () => {
    expect(
      buildEmailAppOpenHref({
        WEEKLY_SUMMARY_EMAIL_OPEN_APP_ONLY: 'true',
      })
    ).toBe('anto://');
  });

  it('con OPEN_APP_ONLY y path opcional', () => {
    expect(
      buildEmailAppOpenHref({
        WEEKLY_SUMMARY_EMAIL_OPEN_APP_ONLY: 'true',
        WEEKLY_SUMMARY_APP_PATH: '/weekly-summary',
      })
    ).toBe('anto://weekly-summary');
  });

  it('sin flags usa FRONTEND_URL + path', () => {
    const href = buildEmailAppOpenHref({
      FRONTEND_URL: 'https://app.example.com',
      WEEKLY_SUMMARY_EMAIL_LINK_PATH: '/home',
    });
    expect(href).toBe('https://app.example.com/home');
  });

  it('subscriptionThankYou prioriza SUBSCRIPTION_THANKYOU_EMAIL_APP_LINK', () => {
    expect(
      buildEmailAppOpenHref(
        {
          SUBSCRIPTION_THANKYOU_EMAIL_APP_LINK: 'https://pay.example.com/open',
          EMAIL_APP_OPEN_LINK: 'https://generic.example.com/',
        },
        { subscriptionThankYou: true }
      )
    ).toBe('https://pay.example.com/open');
  });

  it('buildWeeklySummaryAppHref sigue siendo alias de buildEmailAppOpenHref', () => {
    expect(buildWeeklySummaryAppHref({ EMAIL_APP_OPEN_LINK: 'https://x/' })).toBe('https://x/');
  });
});
