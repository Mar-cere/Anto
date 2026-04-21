import { describe, expect, it } from '@jest/globals';
import { shouldAttemptRollingSummary } from '../../../services/conversationRollingSummaryService.js';

describe('shouldAttemptRollingSummary', () => {
  it('no intenta si hay pocos mensajes', () => {
    expect(shouldAttemptRollingSummary(10, 0)).toBe(false);
  });

  it('primera vez con suficientes mensajes', () => {
    expect(shouldAttemptRollingSummary(14, 0)).toBe(true);
  });

  it('no refresca si no pasó el intervalo', () => {
    expect(shouldAttemptRollingSummary(18, 14)).toBe(false);
  });

  it('refresca tras intervalo de mensajes nuevos', () => {
    expect(shouldAttemptRollingSummary(22, 14)).toBe(true);
  });
});
