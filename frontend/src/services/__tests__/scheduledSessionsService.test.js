/**
 * Tests unitarios para scheduledSessionsService.js (#15).
 */
import { api } from '../../config/api';
import {
  fetchScheduledSessions,
  createScheduledSession,
  updateScheduledSession,
  deleteScheduledSession,
  pauseAllSessions,
  resumeAllSessions,
} from '../scheduledSessionsService';

// Mock del cliente API
jest.mock('../../config/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  ENDPOINTS: {
    SCHEDULED_SESSIONS: '/api/scheduled-sessions',
    SCHEDULED_SESSION_BY_ID: (id) => `/api/scheduled-sessions/${id}`,
  },
}));

describe('scheduledSessionsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchScheduledSessions', () => {
    it('debe obtener y sanitizar sesiones exitosamente', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          dayOfWeek: 1,
          time: '10:00',
          isActive: true,
          label: 'Sesión mañana',
          notificationId: 'notif-1',
          isPausedGlobally: false,
          createdAt: '2026-07-14T10:00:00Z',
          updatedAt: '2026-07-14T10:00:00Z',
        },
        {
          id: 'session-2',
          dayOfWeek: 3,
          time: '15:30',
          isActive: false,
          label: null,
          notificationId: null,
          isPausedGlobally: true,
          createdAt: '2026-07-14T10:00:00Z',
          updatedAt: '2026-07-14T10:00:00Z',
        },
      ];

      api.get.mockResolvedValue({ data: mockSessions });

      const result = await fetchScheduledSessions();

      expect(api.get).toHaveBeenCalledWith('/api/scheduled-sessions');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('session-1');
      expect(result[0].dayOfWeek).toBe(1);
      expect(result[0].time).toBe('10:00');
      expect(result[0].isActive).toBe(true);
      expect(result[0].label).toBe('Sesión mañana');
    });

    it('debe filtrar sesiones inválidas', async () => {
      const mockSessions = [
        { id: 'session-1', dayOfWeek: 1, time: '10:00', isActive: true },
        { id: null, dayOfWeek: 2, time: '11:00', isActive: true }, // Sin id
        { id: 'session-3', dayOfWeek: 'invalid', time: '12:00' }, // dayOfWeek inválido
        { id: 'session-4', dayOfWeek: 3, time: 'invalid' }, // time inválido
      ];

      api.get.mockResolvedValue({ data: mockSessions });

      const result = await fetchScheduledSessions();

      // Solo la primera sesión es válida
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('session-1');
    });

    it('debe manejar respuesta vacía', async () => {
      api.get.mockResolvedValue({ data: [] });

      const result = await fetchScheduledSessions();

      expect(result).toEqual([]);
    });

    it('debe manejar respuesta no-array', async () => {
      api.get.mockResolvedValue({ data: 'not-an-array' });

      const result = await fetchScheduledSessions();

      expect(result).toEqual([]);
    });

    it('debe propagar errores de red', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      await expect(fetchScheduledSessions()).rejects.toThrow('Network error');
    });
  });

  describe('createScheduledSession', () => {
    it('debe crear sesión exitosamente', async () => {
      const sessionData = {
        dayOfWeek: 1,
        time: '10:00',
        label: 'Sesión mañana',
      };

      const mockResponse = {
        data: {
          id: 'session-1',
          dayOfWeek: 1,
          time: '10:00',
          isActive: true,
          label: 'Sesión mañana',
          notificationId: null,
          isPausedGlobally: false,
          createdAt: '2026-07-14T10:00:00Z',
          updatedAt: '2026-07-14T10:00:00Z',
        },
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await createScheduledSession(sessionData);

      expect(api.post).toHaveBeenCalledWith('/api/scheduled-sessions', {
        dayOfWeek: 1,
        time: '10:00',
        label: 'Sesión mañana',
      });
      expect(result.id).toBe('session-1');
      expect(result.dayOfWeek).toBe(1);
      expect(result.time).toBe('10:00');
    });

    it('debe rechazar sessionData inválido', async () => {
      await expect(createScheduledSession(null)).rejects.toThrow('sessionData must be a valid object');
      await expect(createScheduledSession([])).rejects.toThrow('sessionData must be a valid object');
      await expect(createScheduledSession('invalid')).rejects.toThrow('sessionData must be a valid object');
    });

    it('debe rechazar dayOfWeek faltante', async () => {
      await expect(createScheduledSession({ time: '10:00' })).rejects.toThrow('dayOfWeek is required');
    });

    it('debe rechazar time faltante', async () => {
      await expect(createScheduledSession({ dayOfWeek: 1 })).rejects.toThrow('time is required');
    });

    it('debe rechazar dayOfWeek fuera de rango', async () => {
      await expect(createScheduledSession({ dayOfWeek: 7, time: '10:00' })).rejects.toThrow(
        'dayOfWeek must be an integer between 0 and 6'
      );
      await expect(createScheduledSession({ dayOfWeek: -1, time: '10:00' })).rejects.toThrow(
        'dayOfWeek must be an integer between 0 and 6'
      );
    });

    it('debe rechazar dayOfWeek no entero', async () => {
      await expect(createScheduledSession({ dayOfWeek: 1.5, time: '10:00' })).rejects.toThrow(
        'dayOfWeek must be an integer between 0 and 6'
      );
      await expect(createScheduledSession({ dayOfWeek: NaN, time: '10:00' })).rejects.toThrow(
        'dayOfWeek must be an integer between 0 and 6'
      );
    });

    it('debe rechazar time con formato inválido', async () => {
      await expect(createScheduledSession({ dayOfWeek: 1, time: '25:00' })).rejects.toThrow(
        'time must be in HH:mm format (24-hour)'
      );
      await expect(createScheduledSession({ dayOfWeek: 1, time: '10:60' })).rejects.toThrow(
        'time must be in HH:mm format (24-hour)'
      );
      await expect(createScheduledSession({ dayOfWeek: 1, time: '10' })).rejects.toThrow(
        'time must be in HH:mm format (24-hour)'
      );
    });

    it('debe rechazar time no-string', async () => {
      await expect(createScheduledSession({ dayOfWeek: 1, time: 123 })).rejects.toThrow('time must be a string');
    });

    it('debe sanitizar label con newlines y caracteres problemáticos', async () => {
      const sessionData = {
        dayOfWeek: 1,
        time: '10:00',
        label: 'Sesión\nmañana\tcon<problema>',
      };

      const mockResponse = {
        data: {
          id: 'session-1',
          dayOfWeek: 1,
          time: '10:00',
          isActive: true,
          label: 'Sesión mañana conproblema',
          notificationId: null,
          isPausedGlobally: false,
          createdAt: '2026-07-14T10:00:00Z',
          updatedAt: '2026-07-14T10:00:00Z',
        },
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await createScheduledSession(sessionData);

      // Verificar que el label fue sanitizado
      expect(api.post).toHaveBeenCalledWith('/api/scheduled-sessions', {
        dayOfWeek: 1,
        time: '10:00',
        label: 'Sesión mañana conproblema',
      });
    });

    it('debe truncar label si excede 50 caracteres', async () => {
      const longLabel = 'A'.repeat(60);
      const sessionData = {
        dayOfWeek: 1,
        time: '10:00',
        label: longLabel,
      };

      await expect(createScheduledSession(sessionData)).rejects.toThrow(
        'Label cannot exceed 50 characters'
      );
    });

    it('debe propagar errores de red', async () => {
      api.post.mockRejectedValue(new Error('Network error'));

      await expect(
        createScheduledSession({ dayOfWeek: 1, time: '10:00' })
      ).rejects.toThrow('Network error');
    });
  });

  describe('updateScheduledSession', () => {
    it('debe actualizar sesión exitosamente', async () => {
      const updates = { time: '11:00', label: 'Nueva etiqueta' };

      const mockResponse = {
        data: {
          id: 'session-1',
          dayOfWeek: 1,
          time: '11:00',
          isActive: true,
          label: 'Nueva etiqueta',
          notificationId: null,
          isPausedGlobally: false,
          createdAt: '2026-07-14T10:00:00Z',
          updatedAt: '2026-07-14T10:00:00Z',
        },
      };

      api.put.mockResolvedValue(mockResponse);

      const result = await updateScheduledSession('session-1', updates);

      expect(api.put).toHaveBeenCalledWith('/api/scheduled-sessions/session-1', updates);
      expect(result.time).toBe('11:00');
      expect(result.label).toBe('Nueva etiqueta');
    });

    it('debe rechazar sessionId inválido', async () => {
      await expect(updateScheduledSession(null, { time: '10:00' })).rejects.toThrow('Invalid sessionId');
      await expect(updateScheduledSession('', { time: '10:00' })).rejects.toThrow('Invalid sessionId');
      await expect(updateScheduledSession('   ', { time: '10:00' })).rejects.toThrow('Invalid sessionId');
    });

    it('debe rechazar updates inválido', async () => {
      await expect(updateScheduledSession('session-1', null)).rejects.toThrow(
        'updates must be a valid object'
      );
      await expect(updateScheduledSession('session-1', [])).rejects.toThrow(
        'updates must be a valid object'
      );
    });

    it('debe rechazar si no hay campos para actualizar', async () => {
      await expect(updateScheduledSession('session-1', {})).rejects.toThrow(
        'At least one field must be updated'
      );
    });

    it('debe actualizar solo isActive', async () => {
      const mockResponse = {
        data: {
          id: 'session-1',
          dayOfWeek: 1,
          time: '10:00',
          isActive: false,
          label: null,
          notificationId: null,
          isPausedGlobally: false,
          createdAt: '2026-07-14T10:00:00Z',
          updatedAt: '2026-07-14T10:00:00Z',
        },
      };

      api.put.mockResolvedValue(mockResponse);

      const result = await updateScheduledSession('session-1', { isActive: false });

      expect(api.put).toHaveBeenCalledWith('/api/scheduled-sessions/session-1', { isActive: false });
      expect(result.isActive).toBe(false);
    });

    it('debe propagar errores de red', async () => {
      api.put.mockRejectedValue(new Error('Network error'));

      await expect(
        updateScheduledSession('session-1', { time: '10:00' })
      ).rejects.toThrow('Network error');
    });
  });

  describe('deleteScheduledSession', () => {
    it('debe eliminar sesión (soft delete)', async () => {
      const mockResponse = {
        data: {
          id: 'session-1',
          dayOfWeek: 1,
          time: '10:00',
          isActive: false,
          label: null,
          notificationId: null,
          isPausedGlobally: false,
          createdAt: '2026-07-14T10:00:00Z',
          updatedAt: '2026-07-14T10:00:00Z',
        },
      };

      api.delete.mockResolvedValue(mockResponse);

      const result = await deleteScheduledSession('session-1');

      expect(api.delete).toHaveBeenCalledWith('/api/scheduled-sessions/session-1', { params: {} });
      expect(result.id).toBe('session-1');
    });

    it('debe eliminar sesión (hard delete)', async () => {
      const mockResponse = {
        data: {
          id: 'session-1',
          dayOfWeek: 1,
          time: '10:00',
          isActive: true,
          label: null,
          notificationId: null,
          isPausedGlobally: false,
          createdAt: '2026-07-14T10:00:00Z',
          updatedAt: '2026-07-14T10:00:00Z',
        },
      };

      api.delete.mockResolvedValue(mockResponse);

      const result = await deleteScheduledSession('session-1', true);

      expect(api.delete).toHaveBeenCalledWith('/api/scheduled-sessions/session-1', {
        params: { hard: 'true' },
      });
      expect(result.id).toBe('session-1');
    });

    it('debe rechazar sessionId inválido', async () => {
      await expect(deleteScheduledSession(null)).rejects.toThrow('Invalid sessionId');
      await expect(deleteScheduledSession('')).rejects.toThrow('Invalid sessionId');
      await expect(deleteScheduledSession('   ')).rejects.toThrow('Invalid sessionId');
    });

    it('debe normalizar hardDelete no-boolean', async () => {
      const mockResponse = {
        data: {
          id: 'session-1',
          dayOfWeek: 1,
          time: '10:00',
          isActive: true,
          label: null,
          notificationId: null,
          isPausedGlobally: false,
          createdAt: '2026-07-14T10:00:00Z',
          updatedAt: '2026-07-14T10:00:00Z',
        },
      };

      api.delete.mockResolvedValue(mockResponse);

      await deleteScheduledSession('session-1', 'true');

      // hardDelete no-boolean debe normalizarse a false
      expect(api.delete).toHaveBeenCalledWith('/api/scheduled-sessions/session-1', { params: {} });
    });

    it('debe propagar errores de red', async () => {
      api.delete.mockRejectedValue(new Error('Network error'));

      await expect(deleteScheduledSession('session-1')).rejects.toThrow('Network error');
    });
  });

  describe('pauseAllSessions', () => {
    it('debe pausar sesiones exitosamente', async () => {
      const mockResponse = {
        data: {
          pausedUntil: '2026-07-21T10:00:00Z',
          pauseDays: 7,
        },
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await pauseAllSessions(7);

      expect(api.post).toHaveBeenCalledWith('/api/scheduled-sessions/pause', { pauseDays: 7 });
      expect(result.pausedUntil).toBeInstanceOf(Date);
      expect(result.pauseDays).toBe(7);
    });

    it('debe rechazar pauseDays no-number', async () => {
      await expect(pauseAllSessions('7')).rejects.toThrow('pauseDays must be a number');
    });

    it('debe rechazar pauseDays NaN', async () => {
      await expect(pauseAllSessions(NaN)).rejects.toThrow('pauseDays must be a valid finite number');
    });

    it('debe rechazar pauseDays Infinity', async () => {
      await expect(pauseAllSessions(Infinity)).rejects.toThrow('pauseDays must be a valid finite number');
    });

    it('debe rechazar pauseDays no-integer', async () => {
      await expect(pauseAllSessions(7.5)).rejects.toThrow(
        'pauseDays must be an integer between 1 and 90'
      );
    });

    it('debe rechazar pauseDays fuera de rango', async () => {
      await expect(pauseAllSessions(0)).rejects.toThrow('pauseDays must be an integer between 1 and 90');
      await expect(pauseAllSessions(91)).rejects.toThrow('pauseDays must be an integer between 1 and 90');
    });

    it('debe manejar pausedUntil null', async () => {
      const mockResponse = {
        data: {
          pausedUntil: null,
          pauseDays: 7,
        },
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await pauseAllSessions(7);

      expect(result.pausedUntil).toBeNull();
      expect(result.pauseDays).toBe(7);
    });

    it('debe propagar errores de red', async () => {
      api.post.mockRejectedValue(new Error('Network error'));

      await expect(pauseAllSessions(7)).rejects.toThrow('Network error');
    });
  });

  describe('resumeAllSessions', () => {
    it('debe reanudar sesiones exitosamente', async () => {
      const mockResponse = {
        data: {
          resumed: true,
          wasAlreadyResumed: false,
        },
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await resumeAllSessions();

      expect(api.post).toHaveBeenCalledWith('/api/scheduled-sessions/resume');
      expect(result.resumed).toBe(true);
      expect(result.wasAlreadyResumed).toBe(false);
    });

    it('debe manejar caso ya reanudado', async () => {
      const mockResponse = {
        data: {
          resumed: true,
          wasAlreadyResumed: true,
        },
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await resumeAllSessions();

      expect(result.resumed).toBe(true);
      expect(result.wasAlreadyResumed).toBe(true);
    });

    it('debe propagar errores de red', async () => {
      api.post.mockRejectedValue(new Error('Network error'));

      await expect(resumeAllSessions()).rejects.toThrow('Network error');
    });
  });
});
