/**
 * Tests para ensureIndexes (índices programados al arranque).
 */

import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { ensureIndexes } from '../../../middleware/queryOptimizer.js';

describe('queryOptimizer.ensureIndexes', () => {
  const createIndex = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    createIndex.mockClear();
    jest.spyOn(mongoose, 'model').mockImplementation(() => ({
      collection: { createIndex },
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('define índice parcial User para scheduler de notificaciones (enabled + pushToken)', async () => {
    await ensureIndexes();

    const userPartial = createIndex.mock.calls.find(
      (call) =>
        call[0]?.['notificationPreferences.enabled'] === 1 &&
        call[0]?.pushToken === 1 &&
        call[0]?.['stats.lastActive'] === 1
    );
    expect(userPartial).toBeDefined();
    expect(userPartial[1]).toMatchObject({
      partialFilterExpression: {
        'notificationPreferences.enabled': true,
        pushToken: { $exists: true, $ne: null },
      },
    });
  });

  it('define índice parcial Habit para recordatorios activos', async () => {
    await ensureIndexes();

    const habitPartial = createIndex.mock.calls.find(
      (call) =>
        call[1]?.partialFilterExpression?.['reminder.enabled'] === true &&
        call[0]?.userId === 1
    );
    expect(habitPartial).toBeDefined();
  });
});
