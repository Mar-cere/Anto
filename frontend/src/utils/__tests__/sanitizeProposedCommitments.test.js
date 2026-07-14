/**
 * Tests — sanitizeProposedCommitments
 */
import { describe, expect, it } from '@jest/globals';
import { sanitizeProposedCommitments } from '../../../src/utils/sanitizeProposedCommitments';

describe('sanitizeProposedCommitments', () => {
  it('filtra entradas inválidas', () => {
    expect(sanitizeProposedCommitments(null)).toEqual([]);
    expect(sanitizeProposedCommitments([{ id: 'x', label: 'a' }])).toEqual([]);
  });

  it('acepta propuesta válida', () => {
    const out = sanitizeProposedCommitments([
      {
        id: 'uuid-1',
        label: 'Caminar diez minutos',
        rationaleShort: 'Por lo que comentaste.',
      },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].label).toBe('Caminar diez minutos');
  });

  it('limpia eco de burbuja del chat (la UI usará el default)', () => {
    const out = sanitizeProposedCommitments([
      {
        id: 'uuid-bubble',
        label:
          'Está bien no saberlo ahora; a veces solo se siente la carga sin poder nombrarla. Si quieres, seguimos.',
      },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].label).toBe('');
  });

  it('limita a una propuesta por turno', () => {
    const out = sanitizeProposedCommitments([
      { id: '1', label: 'Primero' },
      { id: '2', label: 'Segundo' },
    ]);
    expect(out).toHaveLength(1);
  });
});
