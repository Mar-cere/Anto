import {
  detectPrimaryDistressSignal,
  isEmotionalHurtNotSelfHarm,
} from '../../../constants/emotionalDistressSignals.js';

describe('emotionalDistressSignals', () => {
  it('detecta anhedonia con typos', () => {
    const hit = detectPrimaryDistressSignal('Esqu aora me an dejado de importan las cosas');
    expect(hit?.signal).toBe('anhedonia');
    expect(hit?.name).toBe('tristeza');
  });

  it('distingue clarificación de valor de anhedonia', () => {
    const hit = detectPrimaryDistressSignal('No me a dejado de importan q valen de mi');
    expect(hit?.signal).toBe('values_clarification');
  });

  it('detecta vapeo adolescente como coping', () => {
    const hit = detectPrimaryDistressSignal('empecé a fumar vapor y tengo 15');
    expect(hit?.signal).toBe('adolescent_substance');
  });

  it('distingue daño emocional por la cara de autolesión', () => {
    const msg = 'lo q me ase daño es mi cara';
    expect(isEmotionalHurtNotSelfHarm(msg)).toBe(true);
    expect(detectPrimaryDistressSignal(msg)?.signal).toBe('emotional_body_hurt');
  });

  it('no marca anhedonia cuando el usuario niega haber perdido interés', () => {
    expect(
      detectPrimaryDistressSignal('No me a dejado de importan q valen de mi')?.signal
    ).toBe('values_clarification');
    expect(detectPrimaryDistressSignal('Esqu aora me an dejado de importan las cosas')?.signal).toBe(
      'anhedonia'
    );
  });

  it('no confunde hacerme daño con daño emocional por la cara', () => {
    expect(isEmotionalHurtNotSelfHarm('a veces pienso en hacerme daño')).toBe(false);
    expect(detectPrimaryDistressSignal('a veces pienso en hacerme daño')).toBeNull();
  });
});
