/**
 * Guardrails del paywall emocional (solo frontend).
 */
import fs from 'fs';
import path from 'path';

const FRONTEND_SRC = path.resolve(__dirname, '..', '..', '..');

function readSrc(relativePath) {
  return fs.readFileSync(path.join(FRONTEND_SRC, relativePath), 'utf8');
}

describe('subscriptionPaywall guard', () => {
  it('SubscriptionContent usa paywall emocional con anual destacado y grid', () => {
    const src = readSrc('components/subscription/SubscriptionContent.js');
    expect(src).toMatch(/PaywallBrandOrb/);
    expect(src).toMatch(/PaywallMemoryCard/);
    expect(src).toMatch(/PaywallFeaturedPlanCard/);
    expect(src).toMatch(/PaywallCompactPlanCard/);
    expect(src).toMatch(/usePaywallDayMemory/);
    expect(src).toMatch(/PAYWALL_HEADLINE/);
    expect(src).toMatch(/PAYWALL_CHOOSE_PLAN/);
    expect(src).toMatch(/useState\('yearly'\)/);
    expect(src).not.toMatch(/from '\.\.\/payments\/PlanCard'/);
  });

  it('SubscriptionContent conserva requisitos App Store', () => {
    const src = readSrc('components/subscription/SubscriptionContent.js');
    expect(src).toMatch(/SubscriptionStatus/);
    expect(src).toMatch(/SubscriptionLegalSection/);
    expect(src).toMatch(/CANCEL_SUBSCRIPTION/);
    expect(src).toMatch(/RESTORE_PURCHASES/);
    expect(src).toMatch(/SUBSCRIBE_AGREEMENT/);
    expect(src).toMatch(/LEGAL_URLS\.TERMS_EULA/);
    expect(src).toMatch(/LEGAL_URLS\.PRIVACY/);
    expect(src).toMatch(/onCancelSubscription/);
    expect(src).toMatch(/onRestorePurchases/);
  });

  it('PaywallFeaturedPlanCard prioriza precio por mes y ancla vs mensual', () => {
    const src = readSrc('components/subscription/PaywallFeaturedPlanCard.js');
    expect(src).toMatch(/formattedPerMonth/);
    expect(src).toMatch(/PAYWALL_VS_MONTHLY/);
    expect(src).toMatch(/PAYWALL_BEST_VALUE/);
  });

  it('PaywallCompactPlanCard muestra desglose mensual', () => {
    const src = readSrc('components/subscription/PaywallCompactPlanCard.js');
    expect(src).toMatch(/computePaywallPlanPricing/);
    expect(src).toMatch(/PAYWALL_PER_MONTH/);
  });

  it('usePaywallDayMemory lee check-in, hábitos, tareas y chat del día', () => {
    const src = readSrc('hooks/usePaywallDayMemory.js');
    expect(src).toMatch(/fetchTodayMoodCheckIn/);
    expect(src).toMatch(/ENDPOINTS\.HABITS/);
    expect(src).toMatch(/ENDPOINTS\.TASKS/);
    expect(src).toMatch(/getMessages/);
    expect(src).toMatch(/inferFirstCheckInToday/);
  });

  it('traducciones SUBSCRIPTION incluyen claves PAYWALL en ES y EN', () => {
    const es = readSrc('constants/translations/es.js');
    const en = readSrc('constants/translations/en.js');
    const esSub = es.slice(es.indexOf('export const SUBSCRIPTION'), es.indexOf('export const SESSION_INSIGHT'));
    const enSub = en.slice(en.indexOf('export const SUBSCRIPTION'), en.indexOf('export const SESSION_INSIGHT'));
    const keys = [
      'PAYWALL_HEADLINE',
      'PAYWALL_MEMORY_OUTRO',
      'PAYWALL_VS_MONTHLY',
      'PAYWALL_CTA',
      'PAYWALL_BENEFIT_1',
    ];
    keys.forEach((key) => {
      expect(esSub).toMatch(new RegExp(`${key}:`));
      expect(enSub).toMatch(new RegExp(`${key}:`));
    });
  });

  it('subscriptionScreenConstants expone copy PAYWALL en DEFAULT_TEXTS', () => {
    const src = readSrc('screens/subscription/subscriptionScreenConstants.js');
    expect(src).toMatch(/PAYWALL_HEADLINE:/);
    expect(src).toMatch(/PAYWALL_VS_MONTHLY:/);
  });

  it('SubscriptionScreen no duplica título en header (hero lleva el mensaje)', () => {
    const src = readSrc('screens/SubscriptionScreen.js');
    expect(src).toMatch(/title=""/);
    expect(src).toMatch(/showBackButton/);
    expect(src).not.toMatch(/title=\{TEXTS\.TITLE\}/);
  });
});
