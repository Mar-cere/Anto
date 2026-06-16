import {
  failsClinicalGuardrails,
  sanitizeObservationalText,
} from '../../../utils/clinicalContentGuardrails.js';
import { buildAbcMacroPatterns } from '../../../services/abcMacroPatternService.js';

describe('clinicalContentGuardrails', () => {
  it('rechaza lenguaje clínico y citas largas', () => {
    expect(failsClinicalGuardrails('tienes un trastorno')).toBe(true);
    expect(failsClinicalGuardrails('«esto es una cita demasiado larga para el chat»')).toBe(true);
    expect(sanitizeObservationalText('conviene notar el ritmo', 80)).toBe('conviene notar el ritmo');
    expect(sanitizeObservationalText('tienes depresión', 80)).toBeNull();
  });
});

describe('abcMacroPatternService guardrails', () => {
  it('filtra muestras con lenguaje clínico', () => {
    const patterns = buildAbcMacroPatterns(
      [
        {
          activatingEvent: 'Trabajo estresante',
          beliefs: 'tienes un trastorno grave',
          emotions: 'ansiedad',
          consequence: 'me alejé',
          emotionIntensity: 6,
        },
        {
          activatingEvent: 'Trabajo estresante',
          beliefs: 'no voy a poder',
          emotions: 'tensión',
          consequence: 'respiré',
          emotionIntensity: 5,
        },
      ],
      { language: 'es' },
    );
    expect(patterns).toHaveLength(1);
    expect(patterns[0].beliefSamples).not.toContain('tienes un trastorno grave');
    expect(patterns[0].beliefSamples).toContain('no voy a poder');
  });
});
