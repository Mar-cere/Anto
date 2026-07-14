import { CUSTOM_GOAL_MAX_LEN, normalizeCustomGoal } from '../customGoalUtils';

describe('customGoalUtils', () => {
  it('devuelve null si está vacío o solo espacios', () => {
    expect(normalizeCustomGoal('')).toBeNull();
    expect(normalizeCustomGoal('   ')).toBeNull();
    expect(normalizeCustomGoal(null)).toBeNull();
    expect(normalizeCustomGoal(undefined)).toBeNull();
  });

  it('recorta espacios y colapsa blancos internos', () => {
    expect(normalizeCustomGoal('  Dormir mejor  ')).toBe('Dormir mejor');
    expect(normalizeCustomGoal('Hablar\n\ncon calma')).toBe('Hablar con calma');
  });

  it('elimina caracteres de control y <>{}', () => {
    expect(normalizeCustomGoal('Objetivo <script>')).toBe('Objetivo script');
    expect(normalizeCustomGoal('A {meta} B')).toBe('A meta B');
  });

  it('respeta el tope de 200 caracteres', () => {
    const long = 'a'.repeat(CUSTOM_GOAL_MAX_LEN + 40);
    expect(normalizeCustomGoal(long)).toHaveLength(CUSTOM_GOAL_MAX_LEN);
  });
});
