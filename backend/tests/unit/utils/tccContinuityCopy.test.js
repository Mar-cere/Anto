import { tccContinuityCopy } from '../../../utils/tccContinuityCopy.js';

describe('tccContinuityCopy', () => {
  it('expone strings en español', () => {
    const copy = tccContinuityCopy('es');
    expect(copy.baToday).toContain('Hoy');
    expect(copy.exposureTitle).toContain('Exposición');
  });

  it('expone strings en inglés', () => {
    const copy = tccContinuityCopy('en');
    expect(copy.baToday).toContain('Today');
    expect(copy.chatStripKicker).toContain('Pick up');
  });
});
