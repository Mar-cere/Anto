import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockConnect = jest.fn();
const mockOn = jest.fn();
const connection = {
  readyState: 0,
  name: 'anto-test',
  on: (...args) => mockOn(...args),
};

jest.unstable_mockModule('mongoose', () => ({
  default: {
    connect: (...args) => mockConnect(...args),
    connection,
  },
}));

jest.unstable_mockModule('../../../utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    critical: jest.fn(),
    debug: jest.fn(),
  },
}));

const {
  normalizeMongoUri,
  computeReconnectDelayMs,
  startMongoConnection,
  stopMongoConnectionRetries,
  __resetMongoConnectionServiceForTests,
  connectMongoOnce,
} = await import('../../../services/mongoConnectionService.js');

describe('mongoConnectionService', () => {
  beforeEach(() => {
    __resetMongoConnectionServiceForTests();
    mockConnect.mockReset();
    mockOn.mockReset();
    connection.readyState = 0;
    jest.useFakeTimers();
  });

  afterEach(() => {
    stopMongoConnectionRetries();
    __resetMongoConnectionServiceForTests();
    jest.useRealTimers();
  });

  it('normalizeMongoUri agrega path /anto si falta nombre de DB', () => {
    expect(normalizeMongoUri('mongodb+srv://u:p@cluster.mongodb.net/?retryWrites=true')).toBe(
      'mongodb+srv://u:p@cluster.mongodb.net/anto?retryWrites=true',
    );
    expect(normalizeMongoUri('mongodb://127.0.0.1:27017')).toBe('mongodb://127.0.0.1:27017/anto');
    expect(normalizeMongoUri('mongodb://127.0.0.1:27017/anto')).toBe(
      'mongodb://127.0.0.1:27017/anto',
    );
  });

  it('computeReconnectDelayMs aplica backoff acotado', () => {
    expect(computeReconnectDelayMs(0, { baseMs: 1000, maxMs: 10000 })).toBe(1000);
    expect(computeReconnectDelayMs(2, { baseMs: 1000, maxMs: 10000 })).toBe(4000);
    expect(computeReconnectDelayMs(10, { baseMs: 1000, maxMs: 10000 })).toBe(10000);
  });

  it('startMongoConnection conecta en el primer intento', async () => {
    mockConnect.mockImplementation(async () => {
      connection.readyState = 1;
    });
    const ensureIndexes = jest.fn().mockResolvedValue(undefined);

    const result = await startMongoConnection({
      uri: 'mongodb://127.0.0.1:27017/anto',
      ensureIndexes,
      initialMaxAttempts: 3,
      initialRetryBaseMs: 10,
    });

    expect(result).toMatchObject({ started: true, connected: true, attempts: 1 });
    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(ensureIndexes).toHaveBeenCalled();
    expect(mockOn).toHaveBeenCalled();
  });

  it('reintenta tras fallos iniciales y programa background si no conecta', async () => {
    mockConnect.mockRejectedValue(new Error('server selection timeout'));

    const startPromise = startMongoConnection({
      uri: 'mongodb://127.0.0.1:27017/anto',
      initialMaxAttempts: 2,
      initialRetryBaseMs: 100,
    });

    await jest.advanceTimersByTimeAsync(100);
    const result = await startPromise;

    expect(result).toMatchObject({ started: true, connected: false, attempts: 2 });
    expect(mockConnect).toHaveBeenCalledTimes(2);

    // Background retry scheduled
    mockConnect.mockImplementation(async () => {
      connection.readyState = 1;
    });
    await jest.advanceTimersByTimeAsync(60000);
    expect(mockConnect.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('connectMongoOnce es no-op si ya está connected', async () => {
    connection.readyState = 1;
    const ok = await connectMongoOnce('mongodb://127.0.0.1:27017/anto');
    expect(ok).toBe(true);
    expect(mockConnect).not.toHaveBeenCalled();
  });
});
