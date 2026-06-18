import { buildMappedSectionTexts } from '../useTranslations';

describe('buildMappedSectionTexts', () => {
  const defaults = {
    TITLE: 'Fallback title',
    HINT: 'Fallback hint',
  };

  it('usa traducciones cuando existen', () => {
    const result = buildMappedSectionTexts(
      { TITLE: 'Título traducido', HINT: 'Pista traducida' },
      defaults,
      { TITLE: 'TITLE', HINT: 'HINT' },
    );
    expect(result.TITLE).toBe('Título traducido');
    expect(result.HINT).toBe('Pista traducida');
  });

  it('conserva fallback si falta la traducción', () => {
    const result = buildMappedSectionTexts(
      { TITLE: '   ' },
      defaults,
      { TITLE: 'TITLE', HINT: 'HINT' },
    );
    expect(result.TITLE).toBe('Fallback title');
    expect(result.HINT).toBe('Fallback hint');
  });
});
