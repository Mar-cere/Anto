import {
  buildAllTechniquesList,
  getImmediateTechniquesForLanguage,
} from '../../../constants/therapeuticTechniquesLocale.js';
import { formatTechniqueForResponse } from '../../../constants/therapeuticTechniques.js';

describe('therapeuticTechniques locale', () => {
  it('devuelve nombres en inglés para catálogo en', () => {
    const list = buildAllTechniquesList('en');
    expect(list.length).toBeGreaterThan(0);
    const sample = list.find((t) => t.id?.startsWith('immediate-tristeza-'));
    expect(sample?.name).toMatch(/activation|breathing|validation/i);
  });

  it('filtra regulación en alta intensidad sin depender del idioma del nombre', () => {
    const high = getImmediateTechniquesForLanguage('ansiedad', 9, 'en');
    expect(high.length).toBeGreaterThan(0);
    expect(high.every((t) => t.type === 'DBT' || t.regulationPriority === true)).toBe(true);
  });

  it('expone interactiveExercise en técnicas con ejercicio guiado', () => {
    const list = buildAllTechniquesList('en');
    const grounding = list.find((t) => t.interactiveExercise === 'grounding');
    expect(grounding?.name).toMatch(/5-4-3-2-1/i);
  });

  it('formatea técnica en inglés en el chat', () => {
    const technique = getImmediateTechniquesForLanguage('ansiedad', 5, 'en')[0];
    const text = formatTechniqueForResponse(technique, { language: 'en', compact: true });
    expect(text).toMatch(/Main steps/i);
    expect(text).not.toMatch(/Técnica sugerida|Pasos principales/);
  });
});
