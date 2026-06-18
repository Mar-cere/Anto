import { fetchAbcMacroPatterns } from '../../services/abcRecordsService';

jest.mock('../../config/api', () => ({
  api: {
    get: jest.fn(),
  },
  ENDPOINTS: {
    ABC_RECORDS_MACRO_PATTERNS: '/api/abc-records/macro-patterns',
  },
}));

const { api } = require('../../config/api');

describe('abcRecordsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetchAbcMacroPatterns solo expone campos permitidos', async () => {
    api.get.mockResolvedValue({
      data: {
        recordCount: 2,
        patterns: [
          {
            situationSample: 'Reunión',
            count: 3,
            summary: 'Patrón observado',
            beliefSamples: ['secreto'],
            emotionSamples: ['miedo'],
          },
        ],
      },
    });

    const result = await fetchAbcMacroPatterns({
      startDate: '2026-06-01',
      endDate: '2026-06-15',
    });

    expect(api.get).toHaveBeenCalledWith(
      '/api/abc-records/macro-patterns',
      expect.objectContaining({
        startDate: '2026-06-01',
        endDate: '2026-06-15',
        limit: '80',
      }),
    );
    expect(result.patterns).toHaveLength(1);
    expect(result.patterns[0]).toEqual({
      situationSample: 'Reunión',
      count: 3,
      summary: 'Patrón observado',
      disclaimer: 'pattern_observed',
    });
    expect(result.patterns[0].beliefSamples).toBeUndefined();
  });

  it('fetchAbcMacroPatterns pasa detail=cycle y sanitiza ciclo', async () => {
    api.get.mockResolvedValue({
      data: {
        recordCount: 2,
        patterns: [
          {
            situationSample: 'Reunión',
            count: 3,
            summary: 'Patrón observado',
            cycle: {
              trigger: 'Reunión',
              thoughts: ['no puedo'],
              emotions: ['ansiedad'],
              consequences: ['evité'],
            },
            beliefSamples: ['secreto'],
          },
        ],
      },
    });

    const result = await fetchAbcMacroPatterns({
      startDate: '2026-06-01',
      endDate: '2026-06-15',
      detail: 'cycle',
    });

    expect(api.get).toHaveBeenCalledWith(
      '/api/abc-records/macro-patterns',
      expect.objectContaining({
        startDate: '2026-06-01',
        endDate: '2026-06-15',
        detail: 'cycle',
      }),
    );
    expect(result.patterns[0].cycle.trigger).toBe('Reunión');
    expect(result.patterns[0].beliefSamples).toBeUndefined();
  });

  it('fetchAbcMacroPatterns descarta filas incompletas', async () => {
    api.get.mockResolvedValue({
      data: {
        patterns: [{ situationSample: 'x', count: 1, summary: '' }],
      },
    });
    const result = await fetchAbcMacroPatterns({});
    expect(result.patterns).toEqual([]);
  });
});
