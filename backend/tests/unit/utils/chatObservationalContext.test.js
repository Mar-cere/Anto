import {
  isChatObservationalContextBlocked,
  isLlmCrisisTherapeuticExtrasBlocked,
} from '../../../utils/chatObservationalContext.js';

describe('chatObservationalContext', () => {
  it('bloquea snippets en riesgo elevado', () => {
    expect(isChatObservationalContextBlocked('HIGH')).toBe(true);
    expect(isChatObservationalContextBlocked('MEDIUM')).toBe(true);
    expect(isChatObservationalContextBlocked('WARNING')).toBe(true);
    expect(isChatObservationalContextBlocked('LOW')).toBe(false);
  });

  it('isLlmCrisisTherapeuticExtrasBlocked en WARNING/MEDIUM/HIGH', () => {
    expect(isLlmCrisisTherapeuticExtrasBlocked({ riskLevel: 'WARNING' })).toBe(true);
    expect(isLlmCrisisTherapeuticExtrasBlocked({ riskLevel: 'MEDIUM' })).toBe(true);
    expect(isLlmCrisisTherapeuticExtrasBlocked({ riskLevel: 'HIGH' })).toBe(true);
    expect(isLlmCrisisTherapeuticExtrasBlocked({ riskLevel: 'LOW' })).toBe(false);
  });

  it('isLlmCrisisTherapeuticExtrasBlocked con léxico explícito aunque riskLevel sea LOW', () => {
    expect(
      isLlmCrisisTherapeuticExtrasBlocked({
        riskLevel: 'LOW',
        userMessage: 'quiero hacerme daño',
      }),
    ).toBe(true);
  });
});
