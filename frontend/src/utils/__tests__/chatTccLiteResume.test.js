import {
  buildTccLiteUiFromPersistedStep,
  buildTccLiteUiFromResume,
} from '../chatTccLiteResume';

describe('chatTccLiteResume i18n', () => {
  it('buildTccLiteUiFromResume usa copy EN', () => {
    const ui = buildTccLiteUiFromResume(
      { distortionType: 'all_or_nothing', distortionLabel: 'All-or-nothing' },
      'en',
    );
    expect(ui.kicker).toBe('CBT frame');
    expect(ui.stepLabel).toBe('Thought');
    expect(ui.stepShort).toBe('Name the idea');
  });

  it('buildTccLiteUiFromPersistedStep respeta paso avanzado en ES', () => {
    const ui = buildTccLiteUiFromPersistedStep(
      { step: 'check_evidence', distortionType: 'all_or_nothing' },
      'es',
    );
    expect(ui.stepIndex).toBe(1);
    expect(ui.stepLabel).toBe('Evidencia');
  });
});
