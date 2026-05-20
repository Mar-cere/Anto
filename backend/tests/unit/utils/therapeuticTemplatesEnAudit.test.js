import { runTherapeuticTemplatesEnAudit } from '../../../utils/therapeuticTemplatesEnAudit.mjs';

describe('therapeuticTemplatesEnAudit', () => {
  it('plantillas EN pasan auditoría', () => {
    const result = runTherapeuticTemplatesEnAudit();
    expect(result.checked).toBeGreaterThan(100);
    expect(result.ok).toBe(true);
  });
});
