import {
  clampInt,
  escapeRegexForMongo,
  isDevEnvironment,
  safeErrorMessage,
} from '../../../utils/safeApiError.js';

describe('safeApiError', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('escapeRegexForMongo escapa metacaracteres', () => {
    expect(escapeRegexForMongo('a+b(c)')).toBe('a\\+b\\(c\\)');
  });

  it('clampInt acota valores', () => {
    expect(clampInt('999', { min: 1, max: 50, fallback: 10 })).toBe(50);
    expect(clampInt('bad', { min: 1, max: 50, fallback: 10 })).toBe(10);
  });

  it('safeErrorMessage oculta detalle en producción', () => {
    process.env.NODE_ENV = 'production';
    expect(isDevEnvironment()).toBe(false);
    expect(safeErrorMessage(new Error('secreto'))).toBeUndefined();
    process.env.NODE_ENV = 'development';
    expect(safeErrorMessage(new Error('secreto'))).toBe('secreto');
  });
});
