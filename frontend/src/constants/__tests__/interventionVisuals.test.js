import { describe, expect, it } from '@jest/globals';
import {
  INTERVENTION_VISUALS,
  resolveInterventionVisual,
  resolveTccContinuityVisual,
} from '../interventionVisuals';

describe('interventionVisuals', () => {
  it('resuelve icono vectorial para intervenciones conocidas', () => {
    const breathing = resolveInterventionVisual('breathing_exercise');
    expect(breathing.mciIcon).toBe('weather-windy');
    expect(breathing.emoji).toBeTruthy();
    expect(breathing.accentKey).toBe('primary');
  });

  it('usa fallback para ids desconocidos', () => {
    const unknown = resolveInterventionVisual('custom_unknown_tool');
    expect(unknown.mciIcon).toBe('lightbulb-outline');
    expect(unknown.emoji).toBe('💡');
  });

  it('cubre topics avanzados de psicoeducación', () => {
    expect(INTERVENTION_VISUALS.psychoeducation_anxiety_advanced).toBeTruthy();
    expect(INTERVENTION_VISUALS.psychoeducation_depression_advanced).toBeTruthy();
  });

  it('resuelve iconos de continuidad TCC por kind', () => {
    expect(resolveTccContinuityVisual('behavioral_activation').mciIcon).toBe('walk');
    expect(resolveTccContinuityVisual('exposure_hierarchy').accentKey).toBe('warning');
    expect(resolveTccContinuityVisual('unknown_kind').mciIcon).toBe('arrow-right-circle-outline');
  });
});
