import { mapServerHomeInsight } from '../mapServerHomeInsight';

describe('mapServerHomeInsight', () => {
  it('mapea insight del servidor con ctaKey', () => {
    const mapped = mapServerHomeInsight(
      {
        text: 'Notaste más calma los jueves después del chat.',
        source: 'weekly',
        ctaKey: 'HOME_INSIGHT_CTA_WEEKLY',
        destination: 'ActivitySummary',
      },
      { HOME_INSIGHT_CTA_WEEKLY: 'Ver tus patrones' },
    );
    expect(mapped.text).toContain('calma');
    expect(mapped.ctaLabel).toBe('Ver tus patrones');
    expect(mapped.screen).toBe('ActivitySummary');
  });

  it('devuelve null sin texto', () => {
    expect(mapServerHomeInsight(null, {})).toBeNull();
  });

  it('rechaza cta desconocida y destino no permitido', () => {
    const mapped = mapServerHomeInsight(
      {
        text: 'Insight válido con longitud suficiente para mostrar.',
        ctaKey: 'HACKED',
        destination: 'AdminPanel',
      },
      { HOME_INSIGHT_CTA_PROGRESS: 'Ver tu progreso' },
    );
    expect(mapped.screen).toBe('ActivitySummary');
    expect(mapped.ctaLabel).toBe('Ver tu progreso');
  });

  it('devuelve null si falta label de cta', () => {
    expect(
      mapServerHomeInsight(
        { text: 'Insight válido con longitud suficiente para mostrar.' },
        {},
      ),
    ).toBeNull();
  });
});
