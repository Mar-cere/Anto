import { buildMappedSectionTexts } from '../useTranslations';

describe('buildMappedSectionTexts', () => {
  it('prioriza la traducción de la sección sobre el fallback local', () => {
    const texts = buildMappedSectionTexts(
      { TRANSACTIONS_TITLE: 'Transaction History' },
      { TITLE: 'Historial de Transacciones' },
      { TITLE: 'TRANSACTIONS_TITLE' },
    );
    expect(texts.TITLE).toBe('Transaction History');
  });

  it('conserva el fallback si la clave de traducción no existe', () => {
    const texts = buildMappedSectionTexts(
      {},
      { TITLE: 'Historial de Transacciones' },
      { TITLE: 'TRANSACTIONS_TITLE' },
    );
    expect(texts.TITLE).toBe('Historial de Transacciones');
  });

  it('mapea arrays de traducción (p. ej. etiquetas de gráficos)', () => {
    const texts = buildMappedSectionTexts(
      { STATS_SCREEN_DAY_LABELS: ['Mon', 'Tue'] },
      { DAY_LABELS: ['Lun', 'Mar'] },
      { DAY_LABELS: 'STATS_SCREEN_DAY_LABELS' },
    );
    expect(texts.DAY_LABELS).toEqual(['Mon', 'Tue']);
  });
});
