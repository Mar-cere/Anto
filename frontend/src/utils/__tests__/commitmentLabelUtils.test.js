import {
  filterDashboardCommitments,
  formatCommitmentFollowUpPrompt,
  isConcreteCommitmentLabel,
  shouldHideDashboardCommitmentFollowUp,
} from '../commitmentLabelUtils';

describe('commitmentLabelUtils', () => {
  it('rechaza labels genéricos o iguales al paso sugerido', () => {
    expect(isConcreteCommitmentLabel('Caminar 10 minutos', 'Activación conductual')).toBe(true);
    expect(isConcreteCommitmentLabel('Activación conductual', 'Activación conductual')).toBe(false);
    expect(isConcreteCommitmentLabel('Activación conductual')).toBe(false);
    expect(isConcreteCommitmentLabel('a')).toBe(false);
  });

  it('oculta compromiso BA cuando hay fila de plan semanal', () => {
    const commitment = {
      id: '1',
      label: 'Activación conductual',
      followUpAnswer: 'pending',
      interventionId: 'behavioral_activation',
    };
    expect(shouldHideDashboardCommitmentFollowUp(commitment, { hasBaWeekRow: true })).toBe(true);
    expect(shouldHideDashboardCommitmentFollowUp(commitment, { hasBaWeekRow: false })).toBe(true);
  });

  it('filtra compromisos genéricos y duplicados de BA en dashboard', () => {
    const items = [
      { id: '1', label: 'Activación conductual', followUpAnswer: 'pending', interventionId: 'behavioral_activation' },
      { id: '2', label: 'Respirar antes de dormir', followUpAnswer: 'pending' },
    ];
    expect(filterDashboardCommitments(items, { hasBaWeekRow: true })).toHaveLength(1);
    expect(filterDashboardCommitments(items, { hasBaWeekRow: false })).toHaveLength(1);
    expect(filterDashboardCommitments(items, { hasBaWeekRow: false })[0].id).toBe('2');
  });

  it('inserta el label en el prompt de seguimiento', () => {
    expect(formatCommitmentFollowUpPrompt('¿Pudiste con «{label}»?', 'Caminar 10 min')).toBe(
      '¿Pudiste con «Caminar 10 min»?',
    );
  });
});
