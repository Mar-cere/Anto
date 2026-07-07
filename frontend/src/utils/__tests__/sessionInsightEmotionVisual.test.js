import { resolveSessionInsightEmotionIcon } from '../sessionInsightEmotionVisual';

describe('sessionInsightEmotionVisual', () => {
  it('resuelve icono para emociones conocidas', () => {
    expect(resolveSessionInsightEmotionIcon('neutral')).toBe('leaf-outline');
    expect(resolveSessionInsightEmotionIcon('ansiedad')).toBe('pulse-outline');
  });

  it('usa fallback para claves desconocidas', () => {
    expect(resolveSessionInsightEmotionIcon('desconocida')).toBe('sparkles-outline');
  });
});
