import { CATEGORIES, TEXTS } from '../therapeuticTechniquesConstants';
import {
  normalizeTechniqueCategory,
  parseTherapeuticTechniquesResponse,
} from '../therapeuticTechniquesUtils';

describe('normalizeTechniqueCategory', () => {
  it('normaliza mayúsculas y minúsculas', () => {
    expect(normalizeTechniqueCategory('cbt')).toBe(CATEGORIES.CBT);
    expect(normalizeTechniqueCategory('CBT')).toBe(CATEGORIES.CBT);
    expect(normalizeTechniqueCategory('Immediate')).toBe(CATEGORIES.IMMEDIATE);
  });
});

describe('parseTherapeuticTechniquesResponse', () => {
  it('acepta data array aunque no venga success: true', () => {
    const r = parseTherapeuticTechniquesResponse({ data: [{ id: '1' }] });
    expect(r.ok).toBe(true);
    expect(r.data).toEqual([{ id: '1' }]);
  });

  it('rechaza success: false con mensaje controlado', () => {
    const r = parseTherapeuticTechniquesResponse({
      success: false,
      message: 'Token inválido',
    });
    expect(r.ok).toBe(false);
    expect(r.error).toBe(TEXTS.ERROR);
    expect(r.data).toEqual([]);
  });

  it('rechaza notModified y data no array', () => {
    expect(parseTherapeuticTechniquesResponse({ notModified: true }).ok).toBe(false);
    expect(parseTherapeuticTechniquesResponse({ success: true, data: {} }).ok).toBe(false);
    expect(parseTherapeuticTechniquesResponse(null).ok).toBe(false);
  });
});
