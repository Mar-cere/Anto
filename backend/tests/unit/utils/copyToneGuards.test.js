import { focusCopy } from '../../../utils/focusDashboardCopy.js';
import { getMailerStrings } from '../../../constants/emailMailerStrings.js';
import { hasSpanishVoseo } from '../../../utils/copyToneGuards.mjs';

describe('copyToneGuards', () => {
  it('focusDashboardCopy es sin voseo', () => {
    const c = focusCopy('es');
    const values = Object.values(c).filter((v) => typeof v === 'string');
    const hits = values.filter(hasSpanishVoseo);
    expect(hits).toEqual([]);
  });

  it('emailMailerStrings es sin voseo en cadenas planas', () => {
    const strings = getMailerStrings('es');
    const flat = JSON.stringify(strings);
    expect(hasSpanishVoseo(flat)).toBe(false);
  });
});
