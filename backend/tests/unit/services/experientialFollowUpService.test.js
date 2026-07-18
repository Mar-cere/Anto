import { jest } from '@jest/globals';

const mockGetDue = jest.fn();
const mockMarkAsked = jest.fn();
const mockUpdate = jest.fn();
const mockFindOne = jest.fn();
const mockIsBlocked = jest.fn(() => false);
const mockPostCrisis = jest.fn(async () => false);

await jest.unstable_mockModule('../../../services/experientialPatternService.js', () => ({
  __esModule: true,
  getDueExperientialPattern: mockGetDue,
  isExperientialFollowUpEnabled: () => true,
  isExperientialPatternsEnabled: () => true,
  markExperientialFollowUpAsked: mockMarkAsked,
  updateExperientialPattern: mockUpdate,
}));

await jest.unstable_mockModule('../../../utils/chatObservationalContext.js', () => ({
  __esModule: true,
  isChatObservationalContextBlocked: mockIsBlocked,
}));

await jest.unstable_mockModule('../../../utils/commitmentPostCrisisGuard.js', () => ({
  __esModule: true,
  isUserInPostCrisisCommitmentCooldown: mockPostCrisis,
}));

await jest.unstable_mockModule('../../../models/ExperientialPattern.js', () => ({
  __esModule: true,
  default: { findOne: mockFindOne },
}));

const {
  buildExperientialFollowUpPlan,
  buildExperientialFollowUpPromptSnippet,
  classifyExperientialFollowUpAnswerFromText,
  shouldShowExperientialFollowUpChips,
} = await import('../../../services/experientialFollowUpService.js');

const userId = '507f1f77bcf86cd799439011';

describe('experientialFollowUpService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsBlocked.mockReturnValue(false);
    mockPostCrisis.mockResolvedValue(false);
  });

  it('snippet ES menciona contraste y el statement', () => {
    const snip = buildExperientialFollowUpPromptSnippet('las mañanas eran las más difíciles', {
      language: 'es',
      observedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
    });
    expect(snip).toMatch(/Continuidad experiencial/);
    expect(snip).toMatch(/mañanas/);
    expect(snip).toMatch(/cambiado/);
  });

  it('bloquea en crisis', async () => {
    mockIsBlocked.mockReturnValue(true);
    const plan = await buildExperientialFollowUpPlan({
      userId,
      conversationHistory: [{ role: 'user', content: 'hola' }],
      riskLevel: 'HIGH',
    });
    expect(plan).toBeNull();
  });

  it('omite si compromiso due', async () => {
    const plan = await buildExperientialFollowUpPlan({
      userId,
      conversationHistory: [{ role: 'user', content: 'hola' }],
      skipBecauseCommitmentDue: true,
    });
    expect(plan).toBeNull();
    expect(mockGetDue).not.toHaveBeenCalled();
  });

  it('arma plan cuando hay due', async () => {
    mockGetDue.mockResolvedValue({
      id: '507f1f77bcf86cd799439099',
      statement: 'las mañanas eran las más difíciles',
      observedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    });
    const plan = await buildExperientialFollowUpPlan({
      userId,
      conversationHistory: [{ role: 'user', content: 'hola' }],
      language: 'es',
    });
    expect(plan.patternId).toBe('507f1f77bcf86cd799439099');
    expect(plan.promptSnippet).toMatch(/mañanas/);
  });

  it('clasifica respuestas cortas', () => {
    expect(classifyExperientialFollowUpAnswerFromText('un poco mejor')).toBe('changed');
    expect(classifyExperientialFollowUpAnswerFromText('sigue igual')).toBe('unchanged');
    expect(classifyExperientialFollowUpAnswerFromText('omitir')).toBe('skipped');
    expect(classifyExperientialFollowUpAnswerFromText('este es un mensaje muy largo '.repeat(5))).toBeNull();
    // “sí” / “yes” sueltos no deben clasificar (evita falsos positivos).
    expect(classifyExperientialFollowUpAnswerFromText('si')).toBeNull();
    expect(classifyExperientialFollowUpAnswerFromText('yes')).toBeNull();
  });

  it('muestra chips en el mismo turno del plan (1 turno usuario)', () => {
    expect(
      shouldShowExperientialFollowUpChips({
        conversationHistory: [{ role: 'user', content: 'hola' }],
      }),
    ).toBe(true);
    expect(shouldShowExperientialFollowUpChips({ conversationHistory: [] })).toBe(false);
    expect(shouldShowExperientialFollowUpChips({ forceFollowUp: true })).toBe(true);
  });
});
