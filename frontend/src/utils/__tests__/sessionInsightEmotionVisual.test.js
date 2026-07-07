import { resolveSessionInsightEmotionIcon, resolveSessionInsightStepVisual, resolveTccLiteResumeVisual } from '../sessionInsightEmotionVisual';

describe('sessionInsightEmotionVisual', () => {
  it('resuelve icono para emociones conocidas', () => {
    expect(resolveSessionInsightEmotionIcon('neutral')).toBe('leaf-outline');
    expect(resolveSessionInsightEmotionIcon('ansiedad')).toBe('pulse-outline');
  });

  it('usa fallback para claves desconocidas', () => {
    expect(resolveSessionInsightEmotionIcon('desconocida')).toBe('sparkles-outline');
  });

  it('resuelve visual para paso sugerido', () => {
    const visual = resolveSessionInsightStepVisual({ id: 'behavioral_activation' });
    expect(visual.mciIcon).toBe('walk');
  });

  it('resuelve visual para TCC lite', () => {
    expect(resolveTccLiteResumeVisual().mciIcon).toBe('head-lightbulb-outline');
  });
});
