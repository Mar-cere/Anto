/**
 * Tests unitarios para sentry cliente (#27).
 */
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  withScope: jest.fn((fn) => fn({ setTag: jest.fn(), setContext: jest.fn() })),
}));

import * as Sentry from '@sentry/react-native';
import {
  captureChatError,
  initializeClientSentry,
  scrubSentryEvent,
} from '../sentry';

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

  it('rechaza DSN con formato inválido', () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = 'not-a-valid-dsn';
    expect(initializeClientSentry()).toBe(false);
    expect(Sentry.init).not.toHaveBeenCalled();
  });
});

describe('scrubSentryEvent', () => {
  it('redacta breadcrumbs con content y mensajes largos', () => {
    const event = scrubSentryEvent({
      breadcrumbs: [
        { data: { content: 'texto sensible del chat', note: 'x'.repeat(200) } },
      ],
      exception: { values: [{ value: 'a'.repeat(150) }] },
      extra: { message: 'hola' },
    });
    expect(event.breadcrumbs[0].data.content).toBe('[redacted]');
    expect(event.breadcrumbs[0].data.note).toBe('[redacted]');
    expect(event.exception.values[0].value).toBe('[redacted]');
    expect(event.extra.message).toBe('[redacted]');
  });
});

describe('captureChatError sin init', () => {
  it('no lanza si sentry no está activo', () => {
    expect(() => captureChatError(new Error('x'), { code: 'TEST' })).not.toThrow();
  });
});
