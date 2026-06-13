import { INTERVENTION_LABELS_EN } from '../interventionCatalogLabels.en.js';

/** Claves 1.4.3 que deben existir en frontend y backend (ver backend/constants/interventionCatalogLabels.en.js). */
const REQUIRED_14_3_KEYS = [
  'automatic_thought_record',
  'grief_roadmap',
  'relapse_prevention',
  'dbt_stop_skill',
  'act_values_check',
  'sleep_diary_lite',
  'mindfulness_sequence',
  'assertive_i_messages',
  'problem_solving_psst',
  'psychoeducation_grief',
  'psychoeducation_burnout',
];

describe('interventionCatalogLabels.en parity', () => {
  it('incluye claves 1.4.3 para hidratación EN en chat', () => {
    REQUIRED_14_3_KEYS.forEach((key) => {
      expect(typeof INTERVENTION_LABELS_EN[key]).toBe('string');
      expect(INTERVENTION_LABELS_EN[key].length).toBeGreaterThan(2);
    });
  });

  it('tiene al menos 49 entradas alineadas al catálogo backend', () => {
    expect(Object.keys(INTERVENTION_LABELS_EN).length).toBeGreaterThanOrEqual(49);
  });
});
