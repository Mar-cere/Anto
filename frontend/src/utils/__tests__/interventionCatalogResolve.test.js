/**
 * Tests — resolución de IDs del catálogo #127 (biblioteca).
 */
import {
  getInterventionIdByScreen,
  getPsychoeducationInterventionId,
  resolveInterventionIdFromTechnique,
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
});
