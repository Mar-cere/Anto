import {
  buildExposurePrefillParams,
  enrichSuggestionsWithExposurePrefill,
  extractExposureGoalFromMessage,
  suggestExposureStepsFromMessage,
} from '../../../services/exposurePlanPrefillService.js';

const EXPOSURE_MSG =
  'Tengo ansiedad social, 6/10. Evito hablar en reuniones porque me da mucho miedo quedar mal.';

describe('exposurePlanPrefillService (#87)', () => {
  it('extractExposureGoalFromMessage detecta situación evitada', () => {
    const goal = extractExposureGoalFromMessage(EXPOSURE_MSG);
    expect(goal).toMatch(/hablar en reuniones/i);
  });

  it('suggestExposureStepsFromMessage devuelve 2 pasos graduados', () => {
    const steps = suggestExposureStepsFromMessage(EXPOSURE_MSG, 'es');
    expect(steps).toHaveLength(2);
    expect(steps[0]).toMatch(/imaginar/i);
  });

  it('buildExposurePrefillParams incluye goal y steps', () => {
    const params = buildExposurePrefillParams(EXPOSURE_MSG, 'es');
    expect(params?.prefillGoal).toMatch(/reuniones/i);
    expect(params?.prefillSteps).toHaveLength(2);
  });

  it('buildExposurePrefillParams en inglés', () => {
    const params = buildExposurePrefillParams(
      'I avoid speaking in meetings because I am scared of looking bad, 8/10.',
      'en',
    );
    expect(params?.prefillGoal).toMatch(/speaking|meetings/i);
    expect(params?.prefillSteps?.[0]).toMatch(/picture|think/i);
  });

  it('enrichSuggestionsWithExposurePrefill solo toca exposure_hierarchy', () => {
    const formatted = enrichSuggestionsWithExposurePrefill(
      [
        { id: 'exposure_hierarchy', screen: 'ExposureHierarchy' },
        { id: 'abc_record', screen: 'AbcRecord' },
      ],
      EXPOSURE_MSG,
      'es',
    );
    const exposure = formatted.find((s) => s.id === 'exposure_hierarchy');
    const abc = formatted.find((s) => s.id === 'abc_record');
    expect(exposure?.params?.fromChat).toBe(true);
    expect(exposure?.params?.prefillGoal).toBeTruthy();
    expect(abc?.params).toBeUndefined();
  });
});
