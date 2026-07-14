/**
 * Tests unitarios para sessionTelemetryService.js (#15).
 */
import { api } from '../../config/api';
import {
  recordSessionEvent,
  recordSessionStarted,
  recordSessionSkipped,
} from '../sessionTelemetryService';

// Mock del cliente API
jest.mock('../../config/api', () => ({
  api: {
    post: jest.fn(),
  },
  ENDPOINTS: {
    SCHEDULED_SESSIONS: '/api/scheduled-sessions',
  },
}));

describe('sessionTelemetryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Silenciar console.log y console.error en tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  describe('recordSessionEvent', () => {
    it('debe registrar evento exitosamente', async () => {
      const mockResponse = {
        data: {
          eventId: 'event-123',
          eventType: 'session_started',
          timestamp: '2026-07-14T10:00:00Z',
        },
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await recordSessionEvent('session-1', 'session_started', {
        responseLatency: 5000,
        originatedFromNotification: true,
        platform: 'ios',
      });

      expect(api.post).toHaveBeenCalledWith('/api/scheduled-sessions/events', {
        sessionId: 'session-1',
        eventType: 'session_started',
        metadata: {
          responseLatency: 5000,
          originatedFromNotification: true,
          platform: 'ios',
        },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('debe sanitizar metadata correctamente', async () => {
      const mockResponse = { data: { eventId: 'event-123' } };
      api.post.mockResolvedValue(mockResponse);

      await recordSessionEvent('session-1', 'session_started', {
        responseLatency: 5000,
        originatedFromNotification: 'true', // String, debe convertirse a boolean
        conversationId: '  conv-123  ', // Con espacios, debe trimear
        platform: 'IOS', // Uppercase, debe lowercase
        appVersion: '  1.2.3  ', // Con espacios, debe trimear
        extraField: 'ignored', // No válido, debe ignorarse
      });

      expect(api.post).toHaveBeenCalledWith('/api/scheduled-sessions/events', {
        sessionId: 'session-1',
        eventType: 'session_started',
        metadata: {
          responseLatency: 5000,
          originatedFromNotification: true,
          conversationId: 'conv-123',
          platform: 'ios',
          appVersion: '1.2.3',
        },
      });
    });

    it('debe rechazar sessionId inválido', async () => {
      const result1 = await recordSessionEvent(null, 'session_started');
      const result2 = await recordSessionEvent('', 'session_started');
      const result3 = await recordSessionEvent('   ', 'session_started');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toBeNull();
      expect(api.post).not.toHaveBeenCalled();
    });

    it('debe rechazar eventType inválido', async () => {
      const result1 = await recordSessionEvent('session-1', 'invalid_type');
      const result2 = await recordSessionEvent('session-1', '');
      const result3 = await recordSessionEvent('session-1', null);

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toBeNull();
      expect(api.post).not.toHaveBeenCalled();
    });

    it('debe validar responseLatency', async () => {
      const mockResponse = { data: { eventId: 'event-123' } };
      api.post.mockResolvedValue(mockResponse);

      await recordSessionEvent('session-1', 'session_started', {
        responseLatency: NaN, // Inválido, debe omitirse
      });

      // Metadata debe estar vacío
      expect(api.post).toHaveBeenCalledWith('/api/scheduled-sessions/events', {
        sessionId: 'session-1',
        eventType: 'session_started',
        metadata: {},
      });
    });

    it('debe validar platform', async () => {
      const mockResponse = { data: { eventId: 'event-123' } };
      api.post.mockResolvedValue(mockResponse);

      // Plataforma inválida
      await recordSessionEvent('session-1', 'session_started', {
        platform: 'invalid_platform',
      });

      // platform no debe incluirse
      expect(api.post).toHaveBeenCalledWith('/api/scheduled-sessions/events', {
        sessionId: 'session-1',
        eventType: 'session_started',
        metadata: {},
      });
    });

    it('debe retornar null si API falla (sin propagar error)', async () => {
      api.post.mockRejectedValue(new Error('Network error'));

      const result = await recordSessionEvent('session-1', 'session_started', {
        responseLatency: 5000,
      });

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });

    it('debe retornar null si respuesta API es inválida', async () => {
      api.post.mockResolvedValue(null);

      const result = await recordSessionEvent('session-1', 'session_started');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('recordSessionStarted', () => {
    it('debe registrar session_started con opciones', async () => {
      const mockResponse = { data: { eventId: 'event-123' } };
      api.post.mockResolvedValue(mockResponse);

      await recordSessionStarted('session-1', {
        responseLatency: 3000,
        conversationId: 'conv-123',
        platform: 'android',
      });

      expect(api.post).toHaveBeenCalledWith('/api/scheduled-sessions/events', {
        sessionId: 'session-1',
        eventType: 'session_started',
        metadata: {
          responseLatency: 3000,
          conversationId: 'conv-123',
          platform: 'android',
          originatedFromNotification: true,
        },
      });
    });

    it('debe registrar session_started sin opciones', async () => {
      const mockResponse = { data: { eventId: 'event-123' } };
      api.post.mockResolvedValue(mockResponse);

      await recordSessionStarted('session-1');

      expect(api.post).toHaveBeenCalledWith('/api/scheduled-sessions/events', {
        sessionId: 'session-1',
        eventType: 'session_started',
        metadata: {
          originatedFromNotification: true,
        },
      });
    });
  });

  describe('recordSessionSkipped', () => {
    it('debe registrar session_skipped', async () => {
      const mockResponse = { data: { eventId: 'event-123' } };
      api.post.mockResolvedValue(mockResponse);

      await recordSessionSkipped('session-1');

      expect(api.post).toHaveBeenCalledWith('/api/scheduled-sessions/events', {
        sessionId: 'session-1',
        eventType: 'session_skipped',
        metadata: {
          originatedFromNotification: false,
        },
      });
    });
  });
});
