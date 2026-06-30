import { describe, expect, it } from '@jest/globals';
import {
  shouldAttemptRollingSummary,
  scheduleRollingSummaryRefresh,
} from '../../../services/conversationRollingSummaryService.js';

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

describe('scheduleRollingSummaryRefresh', () => {
  it('devuelve una promesa compatible con .catch()', async () => {
    const promise = scheduleRollingSummaryRefresh({
      conversationId: '507f1f77bcf86cd799439011',
      userId: '507f1f77bcf86cd799439099',
    });

    expect(promise).toBeDefined();
    expect(typeof promise.catch).toBe('function');
    await expect(promise.catch(() => {})).resolves.toBeUndefined();
  });
});
