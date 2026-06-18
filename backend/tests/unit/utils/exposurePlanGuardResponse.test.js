import { buildExposureGuardErrorBody, EXPOSURE_GUARD_ERROR_CODES } from '../../../utils/exposurePlanGuardResponse.js';
import { exposurePlanApiCopy } from '../../../utils/exposurePlanApiCopy.js';

describe('exposurePlanGuardResponse (#87 / #190)', () => {
  const copy = exposurePlanApiCopy('es');

  it('mapea errorKey a code estable', () => {
    const body = buildExposureGuardErrorBody('stepLocked', copy);
    expect(body).toMatchObject({
      success: false,
      code: 'STEP_LOCKED',
      error: copy.stepLocked,
    });
  });

  it('expone todos los códigos de guarda', () => {
    expect(Object.keys(EXPOSURE_GUARD_ERROR_CODES)).toEqual(
      expect.arrayContaining([
        'stepIndexInvalid',
        'stepLocked',
        'stepAlreadyCompleted',
        'stepNeedsAttempt',
      ]),
    );
  });
});
