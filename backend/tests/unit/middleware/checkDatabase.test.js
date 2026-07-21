import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const connection = { readyState: 1 };

jest.unstable_mockModule('mongoose', () => ({
  default: { connection },
}));

const { checkDatabaseConnection } = await import('../../../middleware/checkDatabase.js');

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    set(key, value) {
      this.headers[key] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

describe('checkDatabaseConnection', () => {
  beforeEach(() => {
    connection.readyState = 1;
  });

  it('llama next cuando Mongo está connected', () => {
    const next = jest.fn();
    const res = mockRes();
    checkDatabaseConnection({}, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
  });

  it('responde 503 DATABASE_UNAVAILABLE cuando Mongo no está connected', () => {
    connection.readyState = 0;
    const next = jest.fn();
    const res = mockRes();
    checkDatabaseConnection({}, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(503);
    expect(res.headers['Retry-After']).toBe('5');
    expect(res.body).toMatchObject({
      success: false,
      code: 'DATABASE_UNAVAILABLE',
    });
  });
});
