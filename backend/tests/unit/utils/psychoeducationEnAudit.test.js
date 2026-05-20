import { runPsychoeducationEnAudit } from '../../../utils/psychoeducationEnAudit.mjs';

describe('psychoeducationEnAudit', () => {
  it('catálogo EN pasa auditoría', () => {
    const result = runPsychoeducationEnAudit();
    expect(result.checked).toBeGreaterThan(20);
    expect(result.ok).toBe(true);
  });
});
