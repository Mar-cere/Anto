import { runTherapeuticTechniquesEnAudit } from '../../../utils/therapeuticTechniquesEnAudit.mjs';

describe('therapeuticTechniquesEnAudit', () => {
  it('catálogo EN pasa auditoría estructural', () => {
    const result = runTherapeuticTechniquesEnAudit();
    expect(result.checked).toBeGreaterThan(50);
    expect(result.ok).toBe(true);
  });
});
