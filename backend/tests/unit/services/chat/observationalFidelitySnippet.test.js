import { buildObservationalFidelitySnippet } from '../../../../services/chat/observationalFidelitySnippet.js';

describe('observationalFidelitySnippet', () => {
  it('ES', () => {
    const s = buildObservationalFidelitySnippet('es');
    expect(s).toContain('FIDELIDAD OBSERVACIONAL');
    expect(s).toContain('No inventes emociones');
  });

  it('EN', () => {
    const s = buildObservationalFidelitySnippet('en');
    expect(s).toContain('OBSERVATIONAL FIDELITY');
    expect(s).toContain('Do not invent emotions');
  });
});
