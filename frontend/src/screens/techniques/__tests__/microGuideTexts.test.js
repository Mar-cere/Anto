import { parseMicroGuideBrowseResponse, resolveMicroGuideTexts } from '../microGuideTexts';

describe('microGuideTexts', () => {
  it('resolveMicroGuideTexts usa traducciones TECHNIQUES, no claves crudas', () => {
    const texts = resolveMicroGuideTexts({
      MICRO_GUIDE_LIBRARY_TITLE: 'Micro-guides',
      MICRO_GUIDE_LIBRARY_HERO_KICKER: 'Library',
      MICRO_GUIDE_LIBRARY_COUNT: '{n} guides',
      MICRO_GUIDE_LIBRARY_READ_TIME: '~{n} min',
    });
    expect(texts.LIBRARY_TITLE).toBe('Micro-guides');
    expect(texts.HERO_KICKER).toBe('Library');
    expect(texts.GUIDE_COUNT).toBe('{n} guides');
    expect(texts.READ_TIME).toBe('~{n} min');
    expect(texts.LIBRARY_TITLE).not.toMatch(/^MICRO_GUIDE_/);
  });

  it('parseMicroGuideBrowseResponse acepta data envuelta o array plano', () => {
    expect(parseMicroGuideBrowseResponse({ data: [{ guideId: 'a', title: 'Guía A' }] })).toEqual([
      { guideId: 'a', title: 'Guía A' },
    ]);
    expect(parseMicroGuideBrowseResponse([{ guideId: 'b', title: 'Guía B' }])).toEqual([
      { guideId: 'b', title: 'Guía B' },
    ]);
    expect(parseMicroGuideBrowseResponse({ success: true })).toEqual([]);
  });

  it('parseMicroGuideBrowseResponse filtra entradas sin guideId o título', () => {
    expect(
      parseMicroGuideBrowseResponse({
        data: [
          { guideId: 'ok', title: 'Válida' },
          { title: 'Sin id' },
          { guideId: 'no-title' },
          null,
        ],
      }),
    ).toEqual([{ guideId: 'ok', title: 'Válida' }]);
  });
});
