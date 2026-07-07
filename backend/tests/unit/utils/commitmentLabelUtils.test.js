import { describe, expect, it } from '@jest/globals';
import {
  isBehavioralActivationLabel,
  isGenericInterventionCatalogLabel,
  normalizeCommitmentLabel,
} from '../../../utils/commitmentLabelUtils.js';

describe('commitmentLabelUtils', () => {
  it('normaliza acentos y espacios', () => {
    expect(normalizeCommitmentLabel('  Activación   conductual ')).toBe('activacion conductual');
  });

  it('detecta labels genéricos del catálogo', () => {
    expect(isGenericInterventionCatalogLabel('Activación conductual')).toBe(true);
    expect(isGenericInterventionCatalogLabel('Behavioral activation')).toBe(true);
    expect(isGenericInterventionCatalogLabel('Caminar 10 minutos')).toBe(false);
  });

  it('detecta label de activación conductual', () => {
    expect(isBehavioralActivationLabel('Activación conductual')).toBe(true);
    expect(isBehavioralActivationLabel('Salir a caminar')).toBe(false);
  });
});
