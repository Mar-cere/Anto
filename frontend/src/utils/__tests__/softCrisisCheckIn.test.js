/**
 * Tests para utilidades de check-in crisis suave (#19).
 */
import { normalizeSoftCrisisCheckInPayload } from '../softCrisisCheckIn';

describe('softCrisisCheckIn utils', () => {
  it('normalizeSoftCrisisCheckInPayload valida payload activo', () => {
    const normalized = normalizeSoftCrisisCheckInPayload({
      active: true,
      validation: 'Escucho que se siente pesado.',
      subtitle: 'Una pausa breve.',
      techniques: [
        { id: 'breathing', label: 'Respiración', screen: 'BreathingExercise' },
        { id: 'grounding', label: 'Grounding', screen: 'GroundingTechnique' },
      ],
      footnote: 'Si sube mucho el malestar…',
    });
    expect(normalized?.active).toBe(true);
    expect(normalized?.techniques).toHaveLength(2);
  });

  it('normalizeSoftCrisisCheckInPayload retorna null sin técnicas', () => {
    expect(normalizeSoftCrisisCheckInPayload({ active: true, techniques: [] })).toBeNull();
    expect(normalizeSoftCrisisCheckInPayload(null)).toBeNull();
  });

  it('normalizeSoftCrisisCheckInPayload rechaza pantallas no permitidas', () => {
    expect(
      normalizeSoftCrisisCheckInPayload({
        active: true,
        techniques: [{ id: 'x', label: 'Hack', screen: 'EvilScreen' }],
      }),
    ).toBeNull();
  });
});
