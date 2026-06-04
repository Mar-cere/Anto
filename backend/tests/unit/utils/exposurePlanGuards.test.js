import {
  evaluateCompleteExposureStep,
  evaluateLogExposureAttempt,
} from '../../../utils/exposurePlanGuards.js';

function planFixture(overrides = {}) {
  return {
    currentStepIndex: 0,
    steps: [
      { status: 'in_progress', attempts: [] },
      { status: 'pending', attempts: [] },
    ],
    ...overrides,
  };
}

describe('exposurePlanGuards (#87 / #190)', () => {
  it('evaluateCompleteExposureStep rechaza sin intento', () => {
    const result = evaluateCompleteExposureStep(planFixture(), 0);
    expect(result.ok).toBe(false);
    expect(result.errorKey).toBe('stepNeedsAttempt');
  });

  it('evaluateCompleteExposureStep permite con al menos un intento', () => {
    const plan = planFixture({
      steps: [{ status: 'in_progress', attempts: [{ peakSuds: 70, endSuds: 40 }] }, { status: 'pending', attempts: [] }],
    });
    const result = evaluateCompleteExposureStep(plan, 0);
    expect(result.ok).toBe(true);
    expect(result.stepIndex).toBe(0);
  });

  it('evaluateCompleteExposureStep rechaza saltar paso (stepLocked)', () => {
    const plan = planFixture({
      currentStepIndex: 0,
      steps: [
        { status: 'in_progress', attempts: [{ peakSuds: 60, endSuds: 30 }] },
        { status: 'pending', attempts: [{ peakSuds: 50, endSuds: 20 }] },
      ],
    });
    const result = evaluateCompleteExposureStep(plan, 1);
    expect(result.ok).toBe(false);
    expect(result.errorKey).toBe('stepLocked');
  });

  it('evaluateLogExposureAttempt rechaza paso futuro', () => {
    const result = evaluateLogExposureAttempt(planFixture(), 1);
    expect(result.ok).toBe(false);
    expect(result.errorKey).toBe('stepLocked');
  });

  it('evaluateLogExposureAttempt rechaza paso ya completado', () => {
    const plan = planFixture({
      steps: [{ status: 'completed', attempts: [{ peakSuds: 80, endSuds: 50 }] }, { status: 'pending', attempts: [] }],
    });
    const result = evaluateLogExposureAttempt(plan, 0);
    expect(result.ok).toBe(false);
    expect(result.errorKey).toBe('stepAlreadyCompleted');
  });
});
