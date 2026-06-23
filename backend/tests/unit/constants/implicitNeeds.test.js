import { detectImplicitNeeds } from '../../../constants/implicitNeeds.js';

describe('implicitNeeds blindaje', () => {
  it('no marca competencia en "No puedo dormir"', () => {
    const needs = detectImplicitNeeds('No puedo dormir').map((n) => n.type);
    expect(needs).not.toContain('competence');
  });

  it('sí marca competencia en autodesvaloración explícita', () => {
    const needs = detectImplicitNeeds('Siento que no sirvo para nada').map((n) => n.type);
    expect(needs).toContain('competence');
  });

  it('no marca competencia en "no puedo más" (límite emocional)', () => {
    const needs = detectImplicitNeeds('Ya no puedo más').map((n) => n.type);
    expect(needs).not.toContain('competence');
  });
});
