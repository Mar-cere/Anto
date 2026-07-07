import {
  buildCommitmentLabelFromProductTitle,
  commitmentLabelSuggestsHabit,
  suggestProductTypeForCommitment,
} from '../commitmentBridgeUtils';

describe('commitmentBridgeUtils', () => {
  it('buildCommitmentLabelFromProductTitle recorta y normaliza', () => {
    expect(buildCommitmentLabelFromProductTitle('  Meditar   5 min  ')).toBe('Meditar 5 min');
    expect(buildCommitmentLabelFromProductTitle('')).toBe('');
  });

  it('commitmentLabelSuggestsHabit detecta rutina diaria', () => {
    expect(commitmentLabelSuggestsHabit('Rutina diaria de respiración')).toBe(true);
    expect(commitmentLabelSuggestsHabit('Llamar al médico')).toBe(false);
  });

  it('suggestProductTypeForCommitment prioriza intervención y heurística', () => {
    expect(
      suggestProductTypeForCommitment({
        title: 'Paso pequeño',
        interventionId: 'behavioral_activation',
      }),
    ).toBe('task');
    expect(
      suggestProductTypeForCommitment({
        title: 'Meditar cada día',
        interventionId: null,
      }),
    ).toBe('habit');
    expect(
      suggestProductTypeForCommitment({
        title: 'Organizar el escritorio',
        interventionId: 'abc_record',
      }),
    ).toBe('task');
  });
});
