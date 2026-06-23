/**
 * Blindaje estático — gracia de primera sesión en checkSubscription.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(
  path.resolve(__dirname, '../../../middleware/checkSubscription.js'),
  'utf8',
);

describe('checkSubscription grace guard', () => {
  it('ventana de gracia de 24 h', () => {
    expect(src).toMatch(/FIRST_SESSION_GRACE_WINDOW_MS = 24 \* 60 \* 60 \* 1000/);
  });

  it('rutas con gracia incluyen conversaciones, mensajes y tcc-continuity', () => {
    expect(src).toMatch(/req\.path === '\/conversations'/);
    expect(src).toMatch(/req\.path === '\/messages'/);
    expect(src).toMatch(/req\.path === '\/tcc-continuity'/);
  });

  it('gracia marca firstSessionGrace en req.subscription', () => {
    expect(src).toMatch(/firstSessionGrace: true/);
  });
});
