import {
  normalizeSoftLandingPayload,
  normalizeSoftLandingFocus,
} from '../softLandingPostCrisis';

describe('softLandingPostCrisis', () => {
  it('normaliza strip con técnicas permitidas', () => {
    const payload = normalizeSoftLandingPayload({
      active: true,
      version: '1.1',
      endsAt: '2026-07-25T00:00:00.000Z',
      strip: {
        active: true,
        validation: 'Estoy aquí',
        subtitle: 'Pausa',
        techniques: [
          { id: 'breathing', label: 'Respiración', screen: 'BreathingExercise' },
          { id: 'bad', label: 'X', screen: 'UnknownScreen' },
        ],
        dismissible: true,
      },
    });
    expect(payload.active).toBe(true);
    expect(payload.strip.techniques).toHaveLength(1);
    expect(payload.strip.techniques[0].screen).toBe('BreathingExercise');
  });

  it('devuelve null sin active', () => {
    expect(normalizeSoftLandingPayload({ active: false })).toBeNull();
  });

  it('normaliza focus home', () => {
    const focus = normalizeSoftLandingFocus({
      active: true,
      message: 'Estoy aquí cuando quieras.',
      endsAt: '2026-07-25T00:00:00.000Z',
    });
    expect(focus.message).toMatch(/Estoy aquí/);
  });
});
