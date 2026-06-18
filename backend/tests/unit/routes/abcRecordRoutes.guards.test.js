/**
 * Guardas HTTP de ABC (#86 / #212) con auth mock.
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const userId = '507f1f77bcf86cd799439011';

const fetchAbcMacroPatterns = jest.fn();

await jest.unstable_mockModule('../../../middleware/auth.js', () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { _id: userId, userId };
    next();
  },
}));

await jest.unstable_mockModule('../../../services/abcMacroPatternService.js', () => ({
  fetchAbcMacroPatterns,
  toClientAbcPatterns: (patterns) =>
    patterns.map((p) => ({
      situationSample: p.situationSample,
      count: p.count,
      summary: p.summary,
      disclaimer: 'pattern_observed',
    })),
  toClientAbcCyclePatterns: (patterns) =>
    patterns.map((p) => ({
      situationSample: p.situationSample,
      count: p.count,
      summary: p.summary,
      disclaimer: 'pattern_observed',
      cycle: p.cycle,
    })),
}));

const { default: abcRecordRoutes } = await import('../../../routes/abcRecordRoutes.js');

const app = express();
app.use(express.json());
app.use('/api/abc-records', abcRecordRoutes);

describe('ABC record routes guards (#86 / #212)', () => {
  beforeEach(() => {
    fetchAbcMacroPatterns.mockReset();
  });

  it('GET macro-patterns rango inválido devuelve ABC_MACRO_INVALID_RANGE', async () => {
    const response = await request(app)
      .get('/api/abc-records/macro-patterns')
      .query({ startDate: '2026-06-01', endDate: '2024-01-01' })
      .set('X-App-Language', 'es');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.code).toBe('ABC_MACRO_INVALID_RANGE');
  });

  it('GET macro-patterns detail=cycle devuelve ciclo', async () => {
    fetchAbcMacroPatterns.mockResolvedValue({
      recordCount: 2,
      patterns: [
        {
          situationSample: 'Reunión',
          count: 2,
          summary: 'Patrón',
          cycle: { trigger: 'Reunión', thoughts: ['No puedo'], emotions: ['ansiedad'], consequences: [] },
        },
      ],
    });

    const response = await request(app)
      .get('/api/abc-records/macro-patterns')
      .query({ detail: 'cycle' })
      .set('X-App-Language', 'es');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.detail).toBe('cycle');
    expect(response.body.patterns[0].cycle.trigger).toBe('Reunión');
  });
});
