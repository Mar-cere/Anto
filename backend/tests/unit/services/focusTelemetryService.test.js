/**
 * Tests para focusTelemetryService.
 */
import { jest } from '@jest/globals';

describe('focusTelemetryService', () => {
  let logFocusEvent;
  let getFocusEvents;
  let getFocusEventStats;
  let FocusTelemetryEvent;

  beforeAll(async () => {
    FocusTelemetryEvent = (await import('../../../models/FocusTelemetryEvent.js')).default;
    const service = await import('../../../services/focusTelemetryService.js');
    logFocusEvent = service.logFocusEvent;
    getFocusEvents = service.getFocusEvents;
    getFocusEventStats = service.getFocusEventStats;
  });

  describe('logFocusEvent', () => {
    it('debe registrar un evento de foco correctamente', async () => {
      const mockEvent = {
        userId: 'user123',
        eventType: 'focus_started',
        themeId: 'anxiety',
        timestamp: expect.any(Date),
      };

      FocusTelemetryEvent.create = jest.fn().mockResolvedValue(mockEvent);

      await logFocusEvent({
        userId: 'user123',
        eventType: 'focus_started',
        themeId: 'anxiety',
        metadata: { durationWeeks: 4 },
      });

      expect(FocusTelemetryEvent.create).toHaveBeenCalledWith({
        userId: 'user123',
        eventType: 'focus_started',
        themeId: 'anxiety',
        metadata: { durationWeeks: 4 },
        timestamp: expect.any(Date),
      });
    });

    it('debe manejar errores sin lanzar excepciones', async () => {
      FocusTelemetryEvent.create = jest.fn().mockRejectedValue(new Error('DB error'));

      // No debe lanzar error
      await expect(
        logFocusEvent({
          userId: 'user123',
          eventType: 'focus_started',
          themeId: 'anxiety',
        })
      ).resolves.not.toThrow();
    });
  });

  describe('getFocusEvents', () => {
    it('debe obtener eventos de un usuario', async () => {
      const mockEvents = [
        { userId: 'user123', eventType: 'focus_started', timestamp: new Date() },
        { userId: 'user123', eventType: 'focus_paused', timestamp: new Date() },
      ];

      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockEvents),
      };

      FocusTelemetryEvent.find = jest.fn().mockReturnValue(mockChain);

      const result = await getFocusEvents('user123');

      expect(FocusTelemetryEvent.find).toHaveBeenCalledWith({ userId: 'user123' });
      expect(mockChain.sort).toHaveBeenCalledWith({ timestamp: -1 });
      expect(mockChain.limit).toHaveBeenCalledWith(100);
      expect(result).toEqual(mockEvents);
    });

    it('debe aplicar filtros opcionales', async () => {
      const mockEvents = [
        { userId: 'user123', eventType: 'focus_started', themeId: 'anxiety', timestamp: new Date() },
      ];

      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockEvents),
      };

      FocusTelemetryEvent.find = jest.fn().mockReturnValue(mockChain);

      const since = new Date('2024-01-01');
      await getFocusEvents('user123', {
        eventType: 'focus_started',
        themeId: 'anxiety',
        since,
        limit: 50,
      });

      expect(FocusTelemetryEvent.find).toHaveBeenCalledWith({
        userId: 'user123',
        eventType: 'focus_started',
        themeId: 'anxiety',
        timestamp: { $gte: since },
      });
      expect(mockChain.limit).toHaveBeenCalledWith(50);
    });
  });

  describe('getFocusEventStats', () => {
    it('debe obtener estadísticas agregadas', async () => {
      const mockStats = [
        { eventType: 'focus_started', themeId: 'anxiety', count: 10, uniqueUsers: 5 },
        { eventType: 'focus_completed', themeId: 'anxiety', count: 3, uniqueUsers: 3 },
      ];

      FocusTelemetryEvent.aggregate = jest.fn().mockResolvedValue(mockStats);

      const result = await getFocusEventStats();

      expect(FocusTelemetryEvent.aggregate).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });

    it('debe aplicar filtros de fecha', async () => {
      const since = new Date('2024-01-01');
      const until = new Date('2024-12-31');

      FocusTelemetryEvent.aggregate = jest.fn().mockResolvedValue([]);

      await getFocusEventStats({ since, until });

      const pipeline = FocusTelemetryEvent.aggregate.mock.calls[0][0];
      expect(pipeline[0].$match.timestamp.$gte).toEqual(since);
      expect(pipeline[0].$match.timestamp.$lte).toEqual(until);
    });
  });
});
