import { parseMicroGuideBrowseResponse } from '../microGuideTexts';

describe('microGuideTexts', () => {
  it('parseMicroGuideBrowseResponse acepta data envuelta o array plano', () => {
    expect(parseMicroGuideBrowseResponse({ data: [{ guideId: 'a' }] })).toEqual([{ guideId: 'a' }]);
    expect(parseMicroGuideBrowseResponse([{ guideId: 'b' }])).toEqual([{ guideId: 'b' }]);
    expect(parseMicroGuideBrowseResponse({ success: true })).toEqual([]);
  });
});
