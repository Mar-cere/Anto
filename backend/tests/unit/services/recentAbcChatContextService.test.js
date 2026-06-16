import { jest } from '@jest/globals';

const mockFindByUser = jest.fn();

await jest.unstable_mockModule('../../../models/AbcRecord.js', () => ({
  default: { findByUser: mockFindByUser },
}));

const { buildRecentAbcChatSnippet } = await import('../../../services/recentAbcChatContextService.js');

describe('recentAbcChatContextService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devuelve null sin registros recientes', async () => {
    mockFindByUser.mockResolvedValue([]);
    const out = await buildRecentAbcChatSnippet({
      userId: '507f1f77bcf86cd799439011',
      userContent: 'hoy tuve una reunión difícil',
      language: 'es',
    });
    expect(out).toBeNull();
  });

  it('devuelve snippet si el mensaje comparte tema con la situación', async () => {
    mockFindByUser.mockResolvedValue([
      {
        activatingEvent: 'Reunión con el jefe',
        beliefs: 'no voy a poder',
        entryDate: new Date(),
      },
    ]);
    const out = await buildRecentAbcChatSnippet({
      userId: '507f1f77bcf86cd799439011',
      userContent: 'la reunión de hoy me dejó agotado',
      language: 'es',
    });
    expect(out).toContain('Autorregistro ABC reciente');
    expect(out).not.toContain('no voy a poder');
  });

  it('no devuelve snippet si el mensaje no relaciona con la situación', async () => {
    mockFindByUser.mockResolvedValue([
      {
        activatingEvent: 'Reunión con el jefe',
        beliefs: 'ansiedad',
        entryDate: new Date(),
      },
    ]);
    const out = await buildRecentAbcChatSnippet({
      userId: '507f1f77bcf86cd799439011',
      userContent: 'quiero hablar del clima de estos días',
      language: 'es',
    });
    expect(out).toBeNull();
  });

  it('no devuelve snippet en mensajes cortos sin tema compartido', async () => {
    mockFindByUser.mockResolvedValue([
      {
        activatingEvent: 'Reunión con el jefe',
        beliefs: 'ansiedad',
        entryDate: new Date(),
      },
    ]);
    const out = await buildRecentAbcChatSnippet({
      userId: '507f1f77bcf86cd799439011',
      userContent: 'hola',
      language: 'es',
    });
    expect(out).toBeNull();
  });

  it('no devuelve snippet en riesgo HIGH', async () => {
    mockFindByUser.mockResolvedValue([
      {
        activatingEvent: 'Reunión con el jefe',
        beliefs: 'ansiedad',
        entryDate: new Date(),
      },
    ]);
    const out = await buildRecentAbcChatSnippet({
      userId: '507f1f77bcf86cd799439011',
      userContent: 'la reunión me agotó',
      language: 'es',
      riskLevel: 'HIGH',
    });
    expect(out).toBeNull();
  });
});
