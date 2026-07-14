/**
 * Tests de hardening para scheduledSessionsService.js
 * Feature #15: Sesiones programadas - Edge cases y validación robusta
 */

import { jest } from '@jest/globals';

// Mock User model antes de importar el servicio
const mockUser = {
  findById: jest.fn(),
  save: jest.fn(),
  markModified: jest.fn(),
};

jest.unstable_mockModule('../../../models/User.js', () => ({
  default: mockUser,
}));

// Importar el servicio después de los mocks
const {
  getScheduledSessions,
  createSession,
  updateSession,
  deleteSession,
  pauseAllSessions,
} = await import('../../../services/scheduledSessionsService.js');

describe('scheduledSessionsService - Hardening', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getScheduledSessions - Input validation', () => {
    test('debe rechazar userId null', async () => {
      await expect(getScheduledSessions(null)).rejects.toThrow('Invalid userId');
    });

    test('debe rechazar userId undefined', async () => {
      await expect(getScheduledSessions(undefined)).rejects.toThrow('Invalid userId');
    });

    test('debe rechazar userId número', async () => {
      await expect(getScheduledSessions(123)).rejects.toThrow('Invalid userId');
    });

    test('debe retornar array vacío si sessions no es array', async () => {
      mockUser.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            preferences: {
              notifications: {
                scheduledSessions: {
                  sessions: 'not-an-array', // Data corrupted
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
  });

  describe('createSession - Input validation', () => {
    test('debe rechazar userId null', async () => {
      await expect(
        createSession(null, { dayOfWeek: 1, time: '10:00' })
      ).rejects.toThrow('Invalid userId');
    });

    test('debe rechazar payload null', async () => {
      await expect(createSession('user-id-123', null)).rejects.toThrow('Invalid payload');
    });

    test('debe rechazar payload array', async () => {
      await expect(createSession('user-id-123', [])).rejects.toThrow('Invalid payload');
    });

    test('debe rechazar dayOfWeek negativo', async () => {
      await expect(
        createSession('user-id-123', { dayOfWeek: -1, time: '10:00' })
      ).rejects.toThrow('Invalid dayOfWeek');
    });

    test('debe rechazar dayOfWeek > 6', async () => {
      await expect(
        createSession('user-id-123', { dayOfWeek: 7, time: '10:00' })
      ).rejects.toThrow('Invalid dayOfWeek');
    });

    test('debe rechazar dayOfWeek decimal', async () => {
      await expect(
        createSession('user-id-123', { dayOfWeek: 3.5, time: '10:00' })
      ).rejects.toThrow('Invalid dayOfWeek');
    });

    test('debe rechazar time con formato inválido', async () => {
      await expect(
        createSession('user-id-123', { dayOfWeek: 1, time: '25:00' })
      ).rejects.toThrow('Invalid time format');
    });

    test('debe rechazar time sin leading zero', async () => {
      await expect(
        createSession('user-id-123', { dayOfWeek: 1, time: '9:00' })
      ).rejects.toThrow('Invalid time format');
    });

    test('debe manejar sessions data corrupted (no array)', async () => {
      const mockUserObj = {
        _id: 'user-id-123',
        preferences: {
          notifications: {
            scheduledSessions: {
              sessions: 'not-an-array', // Corrupted data
            },
          },
        },
      };

      mockUser.findById.mockResolvedValue(mockUserObj);

      await expect(
        createSession('user-id-123', { dayOfWeek: 1, time: '10:00' })
      ).rejects.toThrow('Sessions data corrupted');
    });

    test('debe hacer trim al time', async () => {
      const mockUserObj = {
        preferences: {
          notifications: {
            scheduledSessions: {
              sessions: [],
            },
          },
        },
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };

      mockUser.findById.mockResolvedValue(mockUserObj);

      const session = await createSession('user-id-123', {
        dayOfWeek: 1,
        time: '  10:00  ',
      });

      expect(session.time).toBe('10:00');
    });

    test('debe normalizar label null cuando no es string', async () => {
      const mockUserObj = {
        preferences: {
          notifications: {
            scheduledSessions: {
              sessions: [],
            },
          },
        },
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      });

      mockUser.findById.mockResolvedValue(mockUserObj);

      const session = await createSession('user-id-123', {
        dayOfWeek: 1,
        time: '10:00',
        label: 123, // Not a string
      });

      expect(session.label).toBe(null);
    });

    test('debe manejar error de Mongoose save', async () => {
      const mockUserObj = {
        preferences: {
          notifications: {
            scheduledSessions: {
              sessions: [],
            },
          },
        },
        markModified: jest.fn(),
        save: jest.fn().mockRejectedValue(new Error('MongoDB connection error')),
      };

      mockUser.findById.mockResolvedValue(mockUserObj);

      await expect(
        createSession('user-id-123', { dayOfWeek: 1, time: '10:00' })
      ).rejects.toThrow('Failed to save session');
    });
  });

  describe('updateSession - Input validation', () => {
    test('debe rechazar userId null', async () => {
      await expect(
        updateSession(null, 'session-id', { label: 'Test' })
      ).rejects.toThrow('Invalid userId');
    });

    test('debe rechazar sessionId vacío', async () => {
      await expect(
        updateSession('user-id-123', '', { label: 'Test' })
      ).rejects.toThrow('Invalid sessionId');
    });

    test('debe rechazar sessionId null', async () => {
      await expect(
        updateSession('user-id-123', null, { label: 'Test' })
      ).rejects.toThrow('Invalid sessionId');
    });

    test('debe rechazar updates null', async () => {
      await expect(
        updateSession('user-id-123', 'session-id', null)
      ).rejects.toThrow('Invalid updates');
    });

    test('debe rechazar updates array', async () => {
      await expect(
        updateSession('user-id-123', 'session-id', [])
      ).rejects.toThrow('Invalid updates');
    });

    test('debe rechazar dayOfWeek decimal en update', async () => {
      const mockUserObj = {
        preferences: {
          notifications: {
            scheduledSessions: {
              sessions: [{ id: 's1', dayOfWeek: 1, time: '10:00', isActive: true }],
            },
          },
        },
      };

      mockUser.findById.mockResolvedValue(mockUserObj);

      await expect(
        updateSession('user-id-123', 's1', { dayOfWeek: 3.5 })
      ).rejects.toThrow('Invalid dayOfWeek');
    });

    test('debe rechazar isActive no booleano en update', async () => {
      const mockUserObj = {
        preferences: {
          notifications: {
            scheduledSessions: {
              sessions: [{ id: 's1', dayOfWeek: 1, time: '10:00', isActive: true }],
            },
          },
        },
      };

      mockUser.findById.mockResolvedValue(mockUserObj);

      await expect(
        updateSession('user-id-123', 's1', { isActive: 'true' }) // String instead of boolean
      ).rejects.toThrow('Invalid isActive value');
    });

    test('debe normalizar label null cuando no es string en update', async () => {
      const mockUserObj = {
        preferences: {
          notifications: {
            scheduledSessions: {
              sessions: [
                { id: 's1', dayOfWeek: 1, time: '10:00', isActive: true, label: 'old' },
              ],
            },
          },
        },
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };

      mockUser.findById.mockResolvedValue(mockUserObj);

      const session = await updateSession('user-id-123', 's1', { label: 123 }); // Not a string

      expect(session.label).toBe(null);
    });
  });

  describe('deleteSession - Input validation', () => {
    test('debe rechazar userId null', async () => {
      await expect(deleteSession(null, 'session-id')).rejects.toThrow('Invalid userId');
    });

    test('debe rechazar sessionId vacío', async () => {
      await expect(deleteSession('user-id-123', '')).rejects.toThrow('Invalid sessionId');
    });

    test('debe normalizar hardDelete a false si no es boolean', async () => {
      const mockUserObj = {
        preferences: {
          notifications: {
            scheduledSessions: {
              sessions: [{ id: 's1', dayOfWeek: 1, time: '10:00', isActive: true }],
            },
          },
        },
        markModified: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
      };

      mockUser.findById.mockResolvedValue(mockUserObj);

      const session = await deleteSession('user-id-123', 's1', 'not-a-boolean');

      // Si hardDelete no es boolean, se normaliza a false (soft delete)
      expect(session.isActive).toBe(false);
    });
  });

  describe('pauseAllSessions - Input validation', () => {
    test('debe rechazar userId null', async () => {
      await expect(pauseAllSessions(null, 7)).rejects.toThrow('Invalid userId');
    });

    test('debe rechazar pauseDays NaN', async () => {
      await expect(pauseAllSessions('user-id-123', NaN)).rejects.toThrow(
        'pauseDays must be a valid number'
      );
    });

    test('debe rechazar pauseDays Infinity', async () => {
      await expect(pauseAllSessions('user-id-123', Infinity)).rejects.toThrow(
        'pauseDays must be a valid number'
      );
    });

    test('debe rechazar pauseDays string', async () => {
      await expect(pauseAllSessions('user-id-123', '7')).rejects.toThrow(
        'pauseDays must be a valid number'
      );
    });

    test('debe rechazar pauseDays = 0', async () => {
      await expect(pauseAllSessions('user-id-123', 0)).rejects.toThrow(
        'pauseDays must be between 1 and 90'
      );
    });

    test('debe rechazar pauseDays > 90', async () => {
      await expect(pauseAllSessions('user-id-123', 91)).rejects.toThrow(
        'pauseDays must be between 1 and 90'
      );
    });

    test('debe normalizar pauseDays decimal a entero', async () => {
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

      const result = await pauseAllSessions('user-id-123', 7.9); // Decimal

      expect(result.pauseDays).toBe(7); // Normalized to integer
    });
  });
});
