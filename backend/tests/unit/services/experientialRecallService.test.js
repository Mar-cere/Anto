import { jest } from '@jest/globals';

const mockList = jest.fn();
const mockHasConsent = jest.fn();
const mockIsBlocked = jest.fn(() => false);
const mockPostCrisis = jest.fn(async () => false);

await jest.unstable_mockModule('../../../services/experientialPatternService.js', () => ({
  __esModule: true,
  hasExperientialPatternsConsent: mockHasConsent,
  isExperientialPatternsEnabled: () => true,
  listExperientialPatterns: mockList,
  normalizeStatementKey: (statement) =>
    String(statement || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 180),
}));

await jest.unstable_mockModule('../../../utils/chatObservationalContext.js', () => ({
  __esModule: true,
  isChatObservationalContextBlocked: mockIsBlocked,
}));

await jest.unstable_mockModule('../../../utils/commitmentPostCrisisGuard.js', () => ({
  __esModule: true,
  isUserInPostCrisisCommitmentCooldown: mockPostCrisis,
}));

const {
  isExperientialRecallIntent,
  scorePatternOverlap,
  selectPatternsForRecall,
  buildExperientialRecallPromptSnippet,
  buildExperientialRecallPlan,
} = await import('../../../services/experientialRecallService.js');

const userId = '507f1f77bcf86cd799439011';
const morningPattern = {
  id: '507f1f77bcf86cd799439099',
  statement: 'las mañanas eran las más difíciles',
  category: 'time_of_day',
  observedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
};

describe('experientialRecallService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsBlocked.mockReturnValue(false);
    mockPostCrisis.mockResolvedValue(false);
    mockHasConsent.mockResolvedValue(true);
    mockList.mockResolvedValue([morningPattern]);
  });

  it('detecta intent de recall ES/EN', () => {
    expect(isExperientialRecallIntent('¿Recuerdas algo de mis mañanas?')).toBe(true);
    expect(isExperientialRecallIntent('do you remember anything about mornings?')).toBe(true);
    expect(isExperientialRecallIntent('hoy me costó arrancar')).toBe(false);
  });

  it('puntúa overlap con mañanas / time_of_day', () => {
    const { score, shared } = scorePatternOverlap(
      'hoy me costó mucho arrancar en la mañana al despertar',
      morningPattern,
    );
    expect(shared).toBeGreaterThanOrEqual(1);
    expect(score).toBeGreaterThan(0);
  });

  it('selecciona por overlap temático sin intent', () => {
    const selected = selectPatternsForRecall({
      userContent: 'esta mañana me sentí pesado al despertar',
      patterns: [morningPattern],
    });
    expect(selected).toHaveLength(1);
    expect(selected[0].id).toBe(morningPattern.id);
  });

  it('con intent de recall usa patrones recientes si no hay overlap', () => {
    const other = {
      id: '507f1f77bcf86cd799439088',
      statement: 'me cuesta poner límites en el trabajo',
      category: 'relationship',
      observedAt: new Date(),
    };
    const selected = selectPatternsForRecall({
      userContent: '¿recuerdas algo de lo que te conté?',
      patterns: [other],
    });
    expect(selected).toHaveLength(1);
    expect(selected[0].id).toBe(other.id);
  });

  it('snippet ES menciona memoria del proceso', () => {
    const snip = buildExperientialRecallPromptSnippet([morningPattern], { language: 'es' });
    expect(snip).toMatch(/Memoria del proceso/);
    expect(snip).toMatch(/mañanas/);
  });

  it('snippet EN menciona process memory', () => {
    const snip = buildExperientialRecallPromptSnippet([morningPattern], { language: 'en' });
    expect(snip).toMatch(/Process memory/);
    expect(snip).toMatch(/mornings|mañanas/i);
  });

  it('plan null sin consent', async () => {
    mockHasConsent.mockResolvedValue(false);
    const plan = await buildExperientialRecallPlan({
      userId,
      userContent: '¿recuerdas mis mañanas?',
    });
    expect(plan).toBeNull();
    expect(mockList).not.toHaveBeenCalled();
  });

  it('plan null en crisis', async () => {
    mockIsBlocked.mockReturnValue(true);
    const plan = await buildExperientialRecallPlan({
      userId,
      userContent: '¿recuerdas mis mañanas?',
      riskLevel: 'HIGH',
    });
    expect(plan).toBeNull();
  });

  it('plan null si follow-up due o compromiso', async () => {
    expect(
      await buildExperientialRecallPlan({
        userId,
        userContent: '¿recuerdas?',
        skipBecauseFollowUpDue: true,
      }),
    ).toBeNull();
    expect(
      await buildExperientialRecallPlan({
        userId,
        userContent: '¿recuerdas?',
        skipBecauseCommitmentDue: true,
      }),
    ).toBeNull();
  });

  it('arma plan con overlap temático', async () => {
    const plan = await buildExperientialRecallPlan({
      userId,
      userContent: 'hoy me costó arrancar en la mañana',
      language: 'es',
    });
    expect(plan?.patterns?.length).toBe(1);
    expect(plan.promptSnippet).toMatch(/mañanas/);
  });
});
