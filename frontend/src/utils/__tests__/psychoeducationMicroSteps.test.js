import { toggleMicroStepCompletion } from '../psychoeducationMicroSteps';

describe('psychoeducationMicroSteps', () => {
  it('toggleMicroStepCompletion marca y desmarca pasos', () => {
    const first = toggleMicroStepCompletion(new Set(), 0, 2);
    expect(first.allDone).toBe(false);
    expect(first.doneSteps.has(0)).toBe(true);

    const second = toggleMicroStepCompletion(first.doneSteps, 1, 2);
    expect(second.allDone).toBe(true);
    expect(second.doneSteps.size).toBe(2);

    const third = toggleMicroStepCompletion(second.doneSteps, 1, 2);
    expect(third.allDone).toBe(false);
    expect(third.doneSteps.has(1)).toBe(false);
  });
});
