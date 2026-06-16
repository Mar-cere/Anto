import { isChatObservationalContextBlocked } from '../../../utils/chatObservationalContext.js';

describe('chatObservationalContext', () => {
  it('bloquea snippets en riesgo elevado', () => {
    expect(isChatObservationalContextBlocked('HIGH')).toBe(true);
    expect(isChatObservationalContextBlocked('MEDIUM')).toBe(true);
    expect(isChatObservationalContextBlocked('WARNING')).toBe(true);
    expect(isChatObservationalContextBlocked('LOW')).toBe(false);
  });
});
