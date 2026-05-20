/**
 * Registro duplicado: mensaje y código localizados (es/en).
 */
import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const mockFindExisting = jest.fn();

jest.unstable_mockModule('../../../models/User.js', () => ({
  default: {
    findOne: () => ({
      select: () => ({
        lean: () => ({
          maxTimeMS: () => mockFindExisting(),
        }),
      }),
    }),
  },
}));

const { default: authRoutes } = await import('../../../routes/authRoutes.js');
const { AUTH_ERROR_CODES } = await import('../../../utils/authErrorCodes.js');
const { authApiCopy } = await import('../../../utils/authApiCopy.js');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

const validBody = {
  email: 'dup@example.com',
  password: 'password123',
  username: 'dupuser',
  termsAccepted: true,
  privacyAccepted: true,
};

describe('Auth routes register duplicate', () => {
  beforeEach(() => {
    mockFindExisting.mockResolvedValue({ _id: 'existing-user-id' });
  });

  it('responde en español con mensaje y código estables', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .set('X-App-Language', 'es')
      .send(validBody);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(authApiCopy('es').emailOrUsernameInUse);
    expect(response.body.code).toBe(AUTH_ERROR_CODES.EMAIL_OR_USERNAME_IN_USE);
  });

  it('responde en inglés con mensaje y código estables', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .set('X-App-Language', 'en')
      .send(validBody);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(authApiCopy('en').emailOrUsernameInUse);
    expect(response.body.code).toBe(AUTH_ERROR_CODES.EMAIL_OR_USERNAME_IN_USE);
  });
});
