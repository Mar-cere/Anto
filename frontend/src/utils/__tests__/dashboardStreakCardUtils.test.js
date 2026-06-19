import {
  buildStreakCardMetaLine,
  resolveStreakUnitLabel,
} from '../dashboardStreakCardUtils';

const TEXTS_ES = {
  STREAK_CARD_DAY_UNIT: 'día en racha',
  STREAK_CARD_DAYS_UNIT: 'días en racha',
  STREAK_CARD_NUDGE: 'sigue así',
  STAT_STREAK_DAYS: 'días en racha',
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
});
