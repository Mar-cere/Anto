/**
 * Flujo recuperación de contraseña: recover → verify → reset (mocks).
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const TEST_EMAIL = 'recover@example.com';
const TEST_CODE = '654321';
const NEW_PASSWORD = 'newpassword8';

const mockSendVerificationCode = jest.fn().mockResolvedValue(undefined);

const OLD_PASSWORD = 'oldpassword8';

const createMockUser = (overrides = {}) => {
  const expiresAt = Date.now() + 15 * 60 * 1000;
  const base = {
    email: TEST_EMAIL,
    resetPasswordCode: TEST_CODE,
    resetPasswordExpires: expiresAt,
    preferences: { language: 'en' },
    password: 'oldhash',
    salt: 'oldsalt',
    comparePassword: jest.fn((candidate) => candidate === OLD_PASSWORD),
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  return base;
};

let mockUser = createMockUser();

function makeUserQuery(doc) {
  const leanDoc = {
    _id: 'user-id',
    resetPasswordCode: doc.resetPasswordCode,
    resetPasswordExpires: doc.resetPasswordExpires,
  };
  const query = {
    select: jest.fn(() => makeUserQuery(doc)),
    lean: jest.fn(() => Promise.resolve(leanDoc)),
  };
  query.then = (onFulfilled, onRejected) =>
    Promise.resolve(doc).then(onFulfilled, onRejected);
  return query;
}

const mockFindOne = jest.fn(() => makeUserQuery(mockUser));

jest.unstable_mockModule('../../../models/User.js', () => ({
  default: {
    findOne: (...args) => mockFindOne(...args),
  },
}));

jest.unstable_mockModule('../../../config/mailer.js', () => ({
  default: {
    sendVerificationCode: (...args) => mockSendVerificationCode(...args),
  },
  sendVerificationCode: (...args) => mockSendVerificationCode(...args),
}));

const { default: authRoutes } = await import('../../../routes/authRoutes.js');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth routes password recovery', () => {
  beforeEach(() => {
    mockUser = createMockUser();
    mockFindOne.mockClear();
    mockSendVerificationCode.mockClear();
  });

  it('POST recover-password envía código y reemplaza uno anterior', async () => {
    const response = await request(app)
      .post('/api/auth/recover-password')
      .set('X-App-Language', 'en')
      .send({ email: TEST_EMAIL });

    expect(response.status).toBe(200);
    expect(response.body.expiresIn).toBe(900);
    expect(mockSendVerificationCode).toHaveBeenCalled();
    expect(mockUser.save).toHaveBeenCalled();
  });

  it('POST verify-code acepta código con guiones', async () => {
    const response = await request(app)
      .post('/api/auth/verify-code')
      .set('X-App-Language', 'en')
      .send({ email: TEST_EMAIL, code: '654-321' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('expiresIn');
  });

  it('POST verify-code distingue código incorrecto vs expirado', async () => {
    const wrong = await request(app)
      .post('/api/auth/verify-code')
      .send({ email: TEST_EMAIL, code: '000000' });

    expect(wrong.status).toBe(400);
    expect(wrong.body.code).toBe('RESET_CODE_INVALID');

    mockUser = createMockUser({
      resetPasswordExpires: Date.now() - 1000,
    });

    const expired = await request(app)
      .post('/api/auth/verify-code')
      .send({ email: TEST_EMAIL, code: TEST_CODE });

    expect(expired.status).toBe(400);
    expect(expired.body.code).toBe('RESET_CODE_EXPIRED');
  });

  it('POST reset-password cambia contraseña con código válido', async () => {
    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: TEST_EMAIL,
        code: TEST_CODE,
        newPassword: NEW_PASSWORD,
      });

    expect(response.status).toBe(200);
    expect(mockUser.save).toHaveBeenCalled();
    expect(mockUser.resetPasswordCode).toBeUndefined();
    expect(mockUser.resetPasswordExpires).toBeUndefined();
  });

  it('POST reset-password rechaza contraseña igual a la actual', async () => {
    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: TEST_EMAIL,
        code: TEST_CODE,
        newPassword: OLD_PASSWORD,
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('PASSWORD_SAME_AS_CURRENT');
  });

  it('POST reset-password rechaza contraseña menor a 8 caracteres', async () => {
    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: TEST_EMAIL,
        code: TEST_CODE,
        newPassword: 'short',
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });
});
