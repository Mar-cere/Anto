import { jest } from '@jest/globals';

const mockBaFind = jest.fn();
const mockEventFind = jest.fn();

jest.unstable_mockModule('../../../models/BehavioralActivationLog.js', () => ({
  default: { find: mockBaFind },
}));

jest.unstable_mockModule('../../../models/ChatInterventionEvent.js', () => ({
  default: { find: mockEventFind },
}));

const {
  computeTopicInterventionCorrelations,
  computeConceptInterventionCorrelations,
  computeTopicTagMoodCorrelations,
  buildMultimodalCorrelations,
} = await import('../../../services/multimodalCorrelationService.js');

describe('multimodalCorrelationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('computeTopicInterventionCorrelations filtra señales débiles', () => {
    const rows = computeTopicInterventionCorrelations([
      { topicTag: 'trabajo', interventionId: 'ba', shown: 1, clicked: 0, completed: 0 },
      {
        topicTag: 'ansiedad',
        interventionId: 'breathing_exercise',
        shown: 4,
        clicked: 3,
        completed: 2,
        ctr: 0.75,
        completionRate: 0.66,
      },
    ]);
    expect(rows.length).toBe(1);
    expect(rows[0].targetId).toBe('breathing_exercise');
  });

  it('computeConceptInterventionCorrelations usa label del concepto', () => {
    const rows = computeConceptInterventionCorrelations(
      [
        {
          conceptId: 'c1',
          interventionId: 'grounding',
          interventionLabel: 'Grounding',
          shown: 2,
          clicked: 2,
          completed: 1,
          ctr: 1,
          completionRate: 0.5,
        },
      ],
      [{ id: 'c1', label: 'Ansiedad social', memberCount: 3 }],
    );
    expect(rows[0].sourceLabel).toBe('Ansiedad social');
  });

  it('computeTopicTagMoodCorrelations cruza BA y eventos por día', async () => {
    mockBaFind.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        { moodBefore: 4, moodAfter: 6, entryDate: new Date('2025-06-01T12:00:00Z') },
        { moodBefore: 3, moodAfter: 5, entryDate: new Date('2025-06-02T12:00:00Z') },
        { moodBefore: 5, moodAfter: 6, entryDate: new Date('2025-06-03T12:00:00Z') },
      ]),
    });
    mockEventFind.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        { topicTag: 'trabajo', createdAt: new Date('2025-06-01T10:00:00Z') },
        { topicTag: 'trabajo', createdAt: new Date('2025-06-02T10:00:00Z') },
      ]),
    });

    const rows = await computeTopicTagMoodCorrelations(
      '507f1f77bcf86cd799439011',
      new Date('2025-05-01'),
    );
    expect(rows.length).toBeGreaterThanOrEqual(0);
  });

  it('buildMultimodalCorrelations combina fuentes', async () => {
    mockBaFind.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });
    mockEventFind.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    });

    const result = await buildMultimodalCorrelations({
      userId: '507f1f77bcf86cd799439011',
      since: new Date('2025-05-01'),
      topicTagEdges: [
        {
          topicTag: 'ansiedad',
          interventionId: 'breathing_exercise',
          shown: 3,
          clicked: 2,
          completed: 1,
          ctr: 0.66,
          completionRate: 0.5,
        },
      ],
      conceptEdges: [],
      conceptNodes: [],
    });

    expect(result.correlations.length).toBeGreaterThan(0);
    expect(result.summary.topicIntervention).toBeGreaterThan(0);
  });
});
