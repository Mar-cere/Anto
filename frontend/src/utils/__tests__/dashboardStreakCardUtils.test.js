import es from '../../constants/translations/es';
import {
  buildStreakCardMetaLine,
  buildStreakCardSeed,
  pickStreakCardNudge,
  pickStreakTierBadge,
  resolveStreakUnitLabel,
} from '../dashboardStreakCardUtils';

const TEXTS_ES = {
  STREAK_CARD_DAY_UNIT: 'día en racha',
  STREAK_CARD_DAYS_UNIT: 'días en racha',
  STREAK_CARD_NUDGE: 'sigue así',
  STAT_STREAK_DAYS: 'días en racha',
  ...es.DASH,
};

describe('dashboardStreakCardUtils', () => {
  it('singular y plural de unidad de racha', () => {
    expect(resolveStreakUnitLabel(1, TEXTS_ES)).toBe('día en racha');
    expect(resolveStreakUnitLabel(5, TEXTS_ES)).toBe('días en racha');
    expect(resolveStreakUnitLabel(0, TEXTS_ES)).toBe('días en racha');
  });

  it('arma meta con tier y ánimo', () => {
    expect(
      buildStreakCardMetaLine({
        tierBadge: 'Primer paso',
        nudge: 'sigue así',
      }),
    ).toBe('Primer paso · sigue así');
  });

  it('usa subtítulo cuando no hay tier', () => {
    expect(
      buildStreakCardMetaLine({
        tierBadge: null,
        fallbackSubtitle: 'Ayer diste un paso.',
      }),
    ).toBe('Ayer diste un paso.');
  });

  it('elige variantes estables por día y racha', () => {
    const seed = buildStreakCardSeed(2, '2026-06-30');
    const badgeA = pickStreakTierBadge('ember', TEXTS_ES, seed);
    const badgeB = pickStreakTierBadge('ember', TEXTS_ES, seed);
    const nudgeA = pickStreakCardNudge('ember', TEXTS_ES, seed);
    const nudgeB = pickStreakCardNudge('ember', TEXTS_ES, seed);

    expect(badgeA).toBeTruthy();
    expect(badgeA).toBe(badgeB);
    expect(nudgeA).toBeTruthy();
    expect(nudgeA).toBe(nudgeB);
  });

  it('expone batería de nudges por nivel', () => {
    const tiers = ['ember', 'warm', 'blaze', 'stellar', 'legend'];
    tiers.forEach((tier) => {
      const variants = new Set(
        Array.from({ length: 12 }, (_, idx) =>
          pickStreakCardNudge(tier, TEXTS_ES, `${idx}:${tier}`),
        ),
      );
      expect(variants.size).toBeGreaterThan(1);
    });
  });
});
