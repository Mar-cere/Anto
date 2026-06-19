/**
 * Tests — resolución de IDs del catálogo #127 (biblioteca).
 */
import {
  getInterventionIdByScreen,
  getPsychoeducationInterventionId,
  resolveInterventionIdFromTechnique,
  resolveInterventionScreen,
} from '../interventionCatalogResolve';

describe('interventionCatalogResolve', () => {
  it('resuelve por linkedScreen', () => {
    expect(
      resolveInterventionIdFromTechnique({
        id: 'legacy-id',
        linkedScreen: 'BehavioralActivation',
      }),
    ).toBe('behavioral_activation');
  });

  it('resuelve psychoed por tema', () => {
    expect(getPsychoeducationInterventionId('burnout')).toBe('psychoeducation_burnout');
  });

  it('resuelve pantallas TCC', () => {
    expect(getInterventionIdByScreen('ExposureHierarchy')).toBe('exposure_hierarchy');
  });

  describe('resolveInterventionScreen (id → pantalla)', () => {
    it('resuelve técnica concreta del catálogo', () => {
      expect(resolveInterventionScreen('behavioral_activation')).toEqual({
        screen: 'BehavioralActivation',
        params: { graphTracked: true },
      });
      expect(resolveInterventionScreen('breathing_exercise')).toEqual({
        screen: 'BreathingExercise',
        params: { graphTracked: true },
      });
    });

    it('resuelve psicoeducación al módulo con tema', () => {
      expect(resolveInterventionScreen('psychoeducation_anxiety')).toEqual({
        screen: 'PsychoeducationModule',
        params: { topic: 'anxiety', graphTracked: true },
      });
    });

    it('resuelve micro-guías', () => {
      expect(resolveInterventionScreen('micro_guide_grounding')).toEqual({
        screen: 'MicroGuide',
        params: { guideId: 'grounding', graphTracked: true },
      });
    });

    it('devuelve null para ids desconocidos o inválidos', () => {
      expect(resolveInterventionScreen('personal-pattern')).toBeNull();
      expect(resolveInterventionScreen('')).toBeNull();
      expect(resolveInterventionScreen(null)).toBeNull();
      expect(resolveInterventionScreen('unknown_intervention_xyz')).toBeNull();
    });
  });
});
