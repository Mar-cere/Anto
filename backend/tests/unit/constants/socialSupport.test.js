import { assessSocialSupport } from '../../../constants/socialSupport.js';

describe('socialSupport contextual', () => {
  it('no infiere apoyo alto solo por mencionar familia o amigos', () => {
    expect(assessSocialSupport('De todo bro amigos tíos y mi familia').level).not.toBe('high');
  });

  it('detecta apoyo alto con señal positiva explícita', () => {
    expect(assessSocialSupport('Mis amigos me ayudan cuando lo necesito').level).toBe('high');
  });

  it('detecta apoyo bajo en bullying sobre la cara', () => {
    expect(assessSocialSupport('Mis amigos me dicen que arruiné mi cara').level).toBe('low');
  });
});
