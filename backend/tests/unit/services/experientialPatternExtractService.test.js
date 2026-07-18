import { sanitizeExtractedCandidates } from '../../../services/experientialPatternExtractService.js';

describe('experientialPatternExtractService', () => {
  it('acepta candidatos de alta confianza', () => {
    const out = sanitizeExtractedCandidates(
      {
        patterns: [
          {
            statement: 'las mañanas eran las más difíciles',
            category: 'time_of_day',
            confidence: 0.9,
          },
        ],
      },
      'es',
    );
    expect(out).toHaveLength(1);
    expect(out[0].category).toBe('time_of_day');
  });

  it('rechaza confidence baja', () => {
    const out = sanitizeExtractedCandidates({
      patterns: [{ statement: 'algo leve', category: 'other', confidence: 0.4 }],
    });
    expect(out).toHaveLength(0);
  });

  it('rechaza contenido clínico', () => {
    const out = sanitizeExtractedCandidates({
      patterns: [
        {
          statement: 'quiero suicidarme mañana',
          category: 'emotion',
          confidence: 0.99,
        },
      ],
    });
    expect(out).toHaveLength(0);
  });

  it('tolera array vacío o parse inválido', () => {
    expect(sanitizeExtractedCandidates(null)).toEqual([]);
    expect(sanitizeExtractedCandidates({ patterns: [] })).toEqual([]);
  });

  it('limita a 2 patrones', () => {
    const out = sanitizeExtractedCandidates({
      patterns: [
        { statement: 'las mañanas eran difíciles', category: 'time_of_day', confidence: 0.9 },
        { statement: 'me cuesta poner límites en casa', category: 'relationship', confidence: 0.85 },
        { statement: 'tercero no debería entrar', category: 'other', confidence: 0.95 },
      ],
    });
    expect(out).toHaveLength(2);
  });
});
