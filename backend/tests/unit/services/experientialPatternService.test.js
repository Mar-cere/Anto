import { jest } from '@jest/globals';

const mockFind = jest.fn();
const mockFindOne = jest.fn();
const mockCreate = jest.fn();
const mockCountDocuments = jest.fn();
const mockUpdateMany = jest.fn();
const mockUpdateOne = jest.fn();
const mockConversationFindOne = jest.fn();
const mockUserFindById = jest.fn();
const mockUserFindByIdAndUpdate = jest.fn();

await jest.unstable_mockModule('../../../config/features.js', () => ({
  __esModule: true,
  features: {
    experientialPatterns: true,
    experientialFollowUp: true,
    experientialExtract: true,
  },
  default: {
    experientialPatterns: true,
    experientialFollowUp: true,
    experientialExtract: true,
  },
}));

await jest.unstable_mockModule('../../../models/ExperientialPattern.js', () => ({
  __esModule: true,
  default: {
    find: mockFind,
    findOne: mockFindOne,
    create: mockCreate,
    countDocuments: mockCountDocuments,
    updateMany: mockUpdateMany,
    updateOne: mockUpdateOne,
  },
  EXPERIENTIAL_PATTERN_CATEGORIES: ['time_of_day', 'emotion', 'relationship', 'coping', 'other'],
  EXPERIENTIAL_FOLLOW_UP_STATUSES: [
    'pending',
    'acknowledged',
    'changed',
    'unchanged',
    'skipped',
    'archived',
  ],
}));

await jest.unstable_mockModule('../../../models/Conversation.js', () => ({
  __esModule: true,
  default: { findOne: mockConversationFindOne },
}));

await jest.unstable_mockModule('../../../models/User.js', () => ({
  __esModule: true,
  default: {
    findById: mockUserFindById,
    findByIdAndUpdate: mockUserFindByIdAndUpdate,
  },
}));

const {
  createExperientialPattern,
  getDueExperientialPattern,
  normalizeStatementKey,
  setExperientialPatternsConsent,
  hasExperientialPatternsConsent,
  updateExperientialPattern,
} = await import('../../../services/experientialPatternService.js');

const userId = '507f1f77bcf86cd799439011';

describe('experientialPatternService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCountDocuments.mockResolvedValue(0);
    mockFindOne.mockReturnValue({ select: () => ({ lean: async () => null }) });
    mockConversationFindOne.mockReturnValue({ select: () => ({ lean: async () => null }) });
    mockUserFindById.mockReturnValue({
      select: () => ({
        lean: async () => ({
          signalConsent: { experientialPatterns: { enabled: true } },
        }),
      }),
    });
  });

  it('normaliza claves para dedupe', () => {
    expect(normalizeStatementKey('Las Mañanas Eran Difíciles!')).toBe(
      'las mananas eran dificiles',
    );
  });

  it('rechaza create sin consent', async () => {
    mockUserFindById.mockReturnValue({
      select: () => ({
        lean: async () => ({
          signalConsent: { experientialPatterns: { enabled: false } },
        }),
      }),
    });
    const result = await createExperientialPattern(userId, {
      statement: 'Las mañanas eran las más difíciles',
    });
    expect(result.error).toBe('consentRequired');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('rechaza statements cortos', async () => {
    const result = await createExperientialPattern(userId, { statement: 'hola' });
    expect(result.error).toBe('statementRequired');
  });

  it('rechaza contenido clínico/crisis', async () => {
    const result = await createExperientialPattern(userId, {
      statement: 'quiero suicidarme esta noche',
    });
    expect(result.error).toBe('statementClinical');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('crea patrón con followUpAt futuro', async () => {
    mockCreate.mockImplementation(async (data) => ({
      toObject: () => ({
        _id: '507f1f77bcf86cd799439012',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    }));
    const result = await createExperientialPattern(userId, {
      statement: 'Las mañanas eran las más difíciles',
      category: 'time_of_day',
    });
    expect(result.error).toBeUndefined();
    expect(result.pattern.statement).toMatch(/mañanas/i);
    expect(result.pattern.followUpAt).toBeTruthy();
    expect(mockCreate).toHaveBeenCalled();
  });

  it('detecta duplicado activo', async () => {
    mockFindOne.mockReturnValue({
      select: () => ({ lean: async () => ({ _id: '507f1f77bcf86cd799439099' }) }),
    });
    const result = await createExperientialPattern(userId, {
      statement: 'Las mañanas eran las más difíciles',
    });
    expect(result.error).toBe('duplicateActive');
  });

  it('getDue requiere consent', async () => {
    mockUserFindById.mockReturnValue({
      select: () => ({
        lean: async () => ({
          signalConsent: { experientialPatterns: { enabled: false } },
        }),
      }),
    });
    const due = await getDueExperientialPattern(userId);
    expect(due).toBeNull();
  });

  it('setConsent actualiza preferencias', async () => {
    mockUserFindByIdAndUpdate.mockReturnValue({
      lean: async () => ({
        signalConsent: {
          experientialPatterns: { enabled: true, enabledAt: new Date() },
        },
      }),
    });
    const result = await setExperientialPatternsConsent(userId, true);
    expect(result.consent.enabled).toBe(true);
  });

  it('hasConsent lee flag', async () => {
    expect(await hasExperientialPatternsConsent(userId)).toBe(true);
  });

  it('archive marca isActive false', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const doc = {
      _id: '507f1f77bcf86cd799439012',
      userId,
      statement: 'Las mañanas eran difíciles',
      normalizedKey: 'las mananas eran dificiles',
      category: 'time_of_day',
      observedAt: new Date(),
      followUpStatus: 'pending',
      isActive: true,
      toObject() {
        return {
          _id: this._id,
          statement: this.statement,
          category: this.category,
          observedAt: this.observedAt,
          followUpStatus: this.followUpStatus,
          isActive: this.isActive,
          archivedAt: this.archivedAt,
          followUpAttempts: 0,
        };
      },
      save,
    };
    mockFindOne.mockResolvedValue(doc);

    const result = await updateExperientialPattern(userId, String(doc._id), { archive: true });
    expect(result.pattern.isActive).toBe(false);
    expect(result.pattern.followUpStatus).toBe('archived');
    expect(save).toHaveBeenCalled();
  });
});
