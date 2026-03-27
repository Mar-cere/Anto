import {
  shouldOfferWellbeingCheckIn,
  INTENSITY_THRESHOLD
} from '../../../services/intenseChatCheckInService.js';

describe('intenseChatCheckInService', () => {
  describe('shouldOfferWellbeingCheckIn', () => {
    it('rechaza si hay crisis formal', () => {
      expect(
        shouldOfferWellbeingCheckIn({
          isCrisis: true,
          emotionalIntensity: 10,
          riskLevel: 'LOW'
        })
      ).toBe(false);
    });

    it('acepta intensidad alta sin crisis', () => {
      expect(
        shouldOfferWellbeingCheckIn({
          isCrisis: false,
          emotionalIntensity: INTENSITY_THRESHOLD,
          riskLevel: 'LOW'
        })
      ).toBe(true);
    });

    it('acepta WARNING sin crisis', () => {
      expect(
        shouldOfferWellbeingCheckIn({
          isCrisis: false,
          emotionalIntensity: 3,
          riskLevel: 'WARNING'
        })
      ).toBe(true);
    });

    it('rechaza LOW normal', () => {
      expect(
        shouldOfferWellbeingCheckIn({
          isCrisis: false,
          emotionalIntensity: 4,
          riskLevel: 'LOW'
        })
      ).toBe(false);
    });
  });
});
