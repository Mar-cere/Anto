import { parseMicroGuideBrowseResponse } from '../microGuideTexts';

describe('microGuideTexts', () => {
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
