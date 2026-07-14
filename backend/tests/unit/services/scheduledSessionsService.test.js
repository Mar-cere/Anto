/**
 * Tests unitarios para scheduledSessionsService.js
 * Feature #15: Sesiones programadas - Lógica de negocio
 */

import { jest } from '@jest/globals';

// Mock User model antes de importar el servicio
const mockUser = {
  findById: jest.fn(),
  save: jest.fn(),
  markModified: jest.fn(),
};

// Mock crypto
const mockCrypto = {
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => 'mock-session-id-123'),
  })),
};

jest.unstable_mockModule('../../../models/User.js', () => ({
  default: mockUser,
}));

jest.unstable_mockModule('crypto', () => ({
  default: mockCrypto,
}));

// Importar el servicio después de los mocks
const {
  getScheduledSessions,
  createSession,
  updateSession,
  deleteSession,
  pauseAllSessions,
  resumeAllSessions,
} = await import('../../../services/scheduledSessionsService.js');

describe('scheduledSessionsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getScheduledSessions', () => {
    test('debe retornar array vacío si el usuario no tiene sesiones', async () => {
      mockUser.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            preferences: {
              notifications: {
                scheduledSessions: {
                  sessions: [],
                  pausedUntil: null,
                },
              },
            },
          }),
        }),
      });

      const sessions = await getScheduledSessions('user-id-123');
      expect(sessions).toEqual([]);
    });

    test('debe retornar sesiones del usuario', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          dayOfWeek: 1,
          time: '10:00',
          isActive: true,
          label: 'Sesión mañana',
        },
      ];

      mockUser.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            preferences: {
              notifications: {
                scheduledSessions: {
                  sessions: mockSessions,
                  pausedUntil: null,
                },
              },
            },
          }),
        }),
      });

      const sessions = await getScheduledSessions('user-id-123');
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe('session-1');
      expect(sessions[0].isPausedGlobally).toBe(false);
    });

    test('debe marcar sesiones como pausadas globalmente si pausedUntil es futuro', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      mockUser.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            preferences: {
              notifications: {
                scheduledSessions: {
                  sessions: [{ id: 's1', dayOfWeek: 1, time: '10:00' }],
                  pausedUntil: futureDate,
                },
              },
            },
          }),
        }),
      });

      const sessions = await getScheduledSessions('user-id-123');
      expect(sessions[0].isPausedGlobally).toBe(true);
    });
  });

  describe('createSession', () => {
    test('debe crear una sesión correctamente', async () => {
      const mockUserObj = {
        _id: 'user-id-123',
        preferences: {
          notifications: {
            scheduledSessions: {
              sessions: [],
              pausedUntil: null,
            },
          },
        },
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };

      mockUser.findById.mockResolvedValue(mockUserObj);

      const payload = {
        dayOfWeek: 1,
        time: '10:00',
        label: 'Sesión mañana',
      };

      const session = await createSession('user-id-123', payload);

      expect(session.id).toBe('mock-session-id-123');
      expect(session.dayOfWeek).toBe(1);
      expect(session.time).toBe('10:00');
      expect(session.label).toBe('Sesión mañana');
      expect(session.isActive).toBe(true);
      expect(mockUserObj.markModified).toHaveBeenCalledWith(
        'preferences.notifications.scheduledSessions'
      );
      expect(mockUserObj.save).toHaveBeenCalled();
    });

    test('debe rechazar crear sesión si se alcanzó el límite total (10)', async () => {
      const existingSessions = Array.from({ length: 10 }, (_, i) => ({
        id: `session-${i}`,
        dayOfWeek: i % 7,
        time: '10:00',
        isActive: i < 7,
      }));

      const mockUserObj = {
        preferences: {
          notifications: {
            scheduledSessions: { sessions: existingSessions },
          },
        },
      };

      mockUser.findById.mockResolvedValue(mockUserObj);

      await expect(
        createSession('user-id-123', { dayOfWeek: 2, time: '12:00' })
      ).rejects.toThrow('Maximum number of scheduled sessions reached');
    });

    test('debe rechazar crear sesión si se alcanzó el límite de activas (7)', async () => {
      const existingSessions = Array.from({ length: 7 }, (_, i) => ({
        id: `session-${i}`,
        dayOfWeek: i,
        time: '10:00',
        isActive: true,
      }));

      const mockUserObj = {
        preferences: {
          notifications: {
            scheduledSessions: { sessions: existingSessions },
          },
        },
      };

      mockUser.findById.mockResolvedValue(mockUserObj);

      await expect(
        createSession('user-id-123', { dayOfWeek: 2, time: '12:00' })
      ).rejects.toThrow('Maximum number of active sessions reached');
    });

    test('debe rechazar crear sesión duplicada (mismo día y hora)', async () => {
      const existingSessions = [
        { id: 's1', dayOfWeek: 1, time: '10:00', isActive: true },
      ];

      const mockUserObj = {
        preferences: {
          notifications: {
            scheduledSessions: { sessions: existingSessions },
          },
        },
      };

      mockUser.findById.mockResolvedValue(mockUserObj);

      await expect(
        createSession('user-id-123', { dayOfWeek: 1, time: '10:00' })
      ).rejects.toThrow('A session is already scheduled for this day and time');
    });
  });

  describe('updateSession', () => {
    test('debe actualizar una sesión correctamente', async () => {
      const existingSessions = [
        {
          id: 'session-1',
          dayOfWeek: 1,
          time: '10:00',
          isActive: true,
          label: 'Vieja',
        },
      ];

      const mockUserObj = {
        preferences: {
          notifications: {
            scheduledSessions: { sessions: existingSessions },
          },
        },
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };

      mockUser.findById.mockResolvedValue(mockUserObj);

      const updates = { label: 'Nueva', time: '11:00' };
      const session = await updateSession('user-id-123', 'session-1', updates);

      expect(session.label).toBe('Nueva');
      expect(session.time).toBe('11:00');
      expect(mockUserObj.markModified).toHaveBeenCalled();
    });

    test('debe rechazar actualizar sesión no existente', async () => {
      const mockUserObj = {
        preferences: {
          notifications: {
            scheduledSessions: { sessions: [] },
          },
        },
      };

      mockUser.findById.mockResolvedValue(mockUserObj);

      await expect(
        updateSession('user-id-123', 'nonexistent', { label: 'Test' })
      ).rejects.toThrow('Session not found');
    });

    test('debe rechazar actualizar si crea un duplicado', async () => {
      const existingSessions = [
        { id: 's1', dayOfWeek: 1, time: '10:00', isActive: true },
        { id: 's2', dayOfWeek: 2, time: '11:00', isActive: true },
      ];

      const mockUserObj = {
        preferences: {
          notifications: {
            scheduledSessions: { sessions: existingSessions },
          },
        },
      };

      mockUser.findById.mockResolvedValue(mockUserObj);

      await expect(
        updateSession('user-id-123', 's2', { dayOfWeek: 1, time: '10:00' })
      ).rejects.toThrow('A session is already scheduled for this day and time');
    });
  });

  describe('deleteSession', () => {
    test('debe hacer soft delete (marcar como inactiva)', async () => {
      const existingSessions = [
        { id: 's1', dayOfWeek: 1, time: '10:00', isActive: true },
      ];

      const mockUserObj = {
        preferences: {
          notifications: {
            scheduledSessions: { sessions: existingSessions },
          },
        },
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };

      mockUser.findById.mockResolvedValue(mockUserObj);

      const session = await deleteSession('user-id-123', 's1', false);

      expect(session.isActive).toBe(false);
      expect(mockUserObj.markModified).toHaveBeenCalled();
    });

    test('debe hacer hard delete (remover del array)', async () => {
      const existingSessions = [
        { id: 's1', dayOfWeek: 1, time: '10:00', isActive: true },
        { id: 's2', dayOfWeek: 2, time: '11:00', isActive: true },
      ];

      const mockUserObj = {
        preferences: {
          notifications: {
            scheduledSessions: { sessions: existingSessions },
          },
        },
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };

      mockUser.findById.mockResolvedValue(mockUserObj);

      await deleteSession('user-id-123', 's1', true);

      expect(existingSessions).toHaveLength(1);
      expect(existingSessions[0].id).toBe('s2');
    });
  });

  describe('pauseAllSessions', () => {
    test('debe pausar todas las sesiones correctamente', async () => {
      const mockUserObj = {
        preferences: {
          notifications: {
            scheduledSessions: {
              sessions: [],
              pausedUntil: null,
            },
          },
        },
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };

      mockUser.findById.mockResolvedValue(mockUserObj);

      const result = await pauseAllSessions('user-id-123', 7);

      expect(result.pauseDays).toBe(7);
      expect(result.pausedUntil).toBeInstanceOf(Date);
      expect(mockUserObj.markModified).toHaveBeenCalled();
    });

    test('debe rechazar pauseDays < 1', async () => {
      await expect(pauseAllSessions('user-id-123', 0)).rejects.toThrow(
        'pauseDays must be between 1 and 90'
      );
    });

    test('debe rechazar pauseDays > 90', async () => {
      await expect(pauseAllSessions('user-id-123', 91)).rejects.toThrow(
        'pauseDays must be between 1 and 90'
      );
    });
  });

  describe('resumeAllSessions', () => {
    test('debe reanudar sesiones correctamente', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const mockUserObj = {
        preferences: {
          notifications: {
            scheduledSessions: {
              sessions: [],
              pausedUntil: futureDate,
            },
          },
        },
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };

      mockUser.findById.mockResolvedValue(mockUserObj);

      const result = await resumeAllSessions('user-id-123');

      expect(result.resumed).toBe(true);
      expect(result.wasAlreadyResumed).toBe(false);
      expect(mockUserObj.preferences.notifications.scheduledSessions.pausedUntil).toBeNull();
    });

    test('debe indicar si ya estaban reanudadas', async () => {
      const mockUserObj = {
        preferences: {
          notifications: {
            scheduledSessions: {
              sessions: [],
              pausedUntil: null,
            },
          },
        },
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };

      mockUser.findById.mockResolvedValue(mockUserObj);

      const result = await resumeAllSessions('user-id-123');

      expect(result.resumed).toBe(true);
      expect(result.wasAlreadyResumed).toBe(true);
    });
  });
});
