import request from 'supertest';
import express from 'express';
import journalRoutes from '../../../routes/journalRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/journals', journalRoutes);

describe('Journal routes i18n', () => {
  it('POST sin auth sigue rechazando (401) antes del copy', async () => {
    const response = await request(app)
      .post('/api/journals')
      .set('X-App-Language', 'en')
      .send({ content: 'test' });

    expect(response.status).toBe(401);
  });
});
