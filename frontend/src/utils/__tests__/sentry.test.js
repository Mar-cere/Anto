/**
 * Tests unitarios para sentry cliente (#27).
 */
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  withScope: jest.fn((fn) => fn({ setTag: jest.fn(), setContext: jest.fn() })),
}));

import * as Sentry from '@sentry/react-native';
import { captureChatError, initializeClientSentry } from '../sentry';

describe('client sentry util', () => {
  const savedDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  afterEach(() => {
    Sentry.init.mockClear();
    Sentry.captureException.mockClear();
    if (savedDsn === undefined) delete process.env.EXPO_PUBLIC_SENTRY_DSN;
    else process.env.EXPO_PUBLIC_SENTRY_DSN = savedDsn;
  });

  it('no inicializa sin DSN', () => {
    delete process.env.EXPO_PUBLIC_SENTRY_DSN;
    expect(initializeClientSentry()).toBe(false);
    expect(Sentry.init).not.toHaveBeenCalled();
  });
});

describe('captureChatError sin init', () => {
  it('no lanza si sentry no está activo', () => {
    expect(() => captureChatError(new Error('x'), { code: 'TEST' })).not.toThrow();
  });
});
