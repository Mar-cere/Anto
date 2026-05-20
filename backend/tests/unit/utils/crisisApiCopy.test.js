import { crisisApiCopy } from '../../../utils/crisisApiCopy.js';
import { crisisRecommendationsCopy } from '../../../utils/crisisRecommendationsCopy.js';

describe('crisisApiCopy', () => {
  it('expone mensajes de error en inglés', () => {
    const copy = crisisApiCopy('en');
    expect(copy.invalidQueryParams).toBe('Invalid query parameters');
    expect(copy.summaryError).toBe('Could not load crisis summary');
    expect(copy.trendsError).toMatch(/trends/i);
    expect(copy.techniqueEffectivenessError).toMatch(/effectiveness/i);
  });

  it('expone mensajes de error en español', () => {
    const copy = crisisApiCopy('es');
    expect(copy.invalidQueryParams).toBe('Parámetros de consulta inválidos');
    expect(copy.summaryError).toBe('Error al obtener resumen de crisis');
  });

  it('localiza etiquetas de emoción y razones de recomendación', () => {
    const copy = crisisApiCopy('en');
    expect(copy.emotionLabel('ansiedad')).toBe('anxiety');
    expect(copy.emotionReason('anxiety')).toMatch(/anxiety/);
    expect(copy.effectiveReason(4)).toMatch(/4\/5/);
  });

  it('crisisRecommendationsCopy reexporta crisisApiCopy', () => {
    const legacy = crisisRecommendationsCopy('en');
    const direct = crisisApiCopy('en');
    expect(legacy.recommendationsError).toBe(direct.recommendationsError);
    expect(legacy.emotionLabel('tristeza')).toBe('sadness');
  });
});
