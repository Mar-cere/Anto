import { describe, expect, it } from '@jest/globals';
import { detectResistance } from '../../../constants/resistancePatterns.js';

describe('resistancePatterns', () => {
  it('clasifica límite saludable como healthy_boundary', () => {
    const out = detectResistance('No quiero ser específica, son demasiadas cosas');
    expect(out).toBeTruthy();
    expect(out.type).toBe('healthy_boundary');
    expect(out.disclosureStyle).toBe('healthy_boundary');
  });

  it('mantiene cierre defensivo como avoidance', () => {
    const out = detectResistance('Prefiero no hablar de eso ahora');
    expect(out).toBeTruthy();
    expect(out.type).toBe('avoidance');
    expect(out.disclosureStyle).toBe('defensive_closure');
  });
});

