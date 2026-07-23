/**
 * Blindaje: refresh automático de JWT y validación de sesión al iniciar.
 */
import fs from 'fs';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const FRONTEND_SRC = path.resolve(__dirname, '..');

function readRepo(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
}

function readSrc(relativePath) {
  return fs.readFileSync(path.join(FRONTEND_SRC, relativePath), 'utf8');
}

describe('authTokenRefresh guard', () => {
  it('utilidad central expone claves de storage y refresh serializado', () => {
    const src = readSrc('utils/authTokenRefresh.js');
    expect(src).toMatch(/AUTH_STORAGE_KEYS/);
    expect(src).toMatch(/USER_TOKEN: 'userToken'/);
    expect(src).toMatch(/REFRESH_TOKEN: 'refreshToken'/);
    expect(src).toMatch(/refreshAccessToken/);
    expect(src).toMatch(/refreshPromise/);
    expect(src).toMatch(/registerOnSessionInvalidated/);
    expect(src).toMatch(/ensureValidAccessToken/);
    expect(src).toMatch(/isAccessTokenStale/);
    expect(src).toMatch(/getAccessTokenExpiryMs/);
    expect(src).toMatch(/\/api\/auth\/refresh/);
  });

  it('api.ts reintenta peticiones autenticadas tras refresh y persiste refreshToken en login', () => {
    const src = readSrc('config/api.ts');
    expect(src).toMatch(/REFRESH: '\/api\/auth\/refresh'/);
    expect(src).toMatch(/withAuthRetry/);
    expect(src).toMatch(/refreshAccessToken/);
    expect(src).toMatch(/ensureValidAccessToken/);
    expect(src).toMatch(/notifySessionInvalidated/);
    expect(src).toMatch(/AUTH_STORAGE_KEYS\.REFRESH_TOKEN/);
    expect(src).toMatch(/AUTH_ENDPOINTS_WITHOUT_REFRESH/);
    expect(src).toMatch(/ENDPOINTS\.REFRESH/);
  });

  it('AuthContext valida sesión remota al iniciar y escucha invalidación', () => {
    const src = readSrc('context/AuthContext.js');
    expect(src).toMatch(/api\.get\(ENDPOINTS\.ME\)/);
    expect(src).toMatch(/registerOnSessionInvalidated/);
    expect(src).toMatch(/isNetworkError/);
    expect(src).toMatch(/handleSessionLoadError/);
    // Sesión huérfana: 404 de /me debe limpiar JWT local (no solo 401/403)
    expect(src).toMatch(/status === 404/);
    expect(src).toMatch(/clearAuthSession/);
  });

  it('login por pantalla guarda refreshToken con la misma clave que api.ts', () => {
    const signIn = readSrc('screens/SignInScreen.js');
    const register = readSrc('screens/register/useRegisterScreen.js');
    const registerConstants = readSrc('screens/register/registerScreenConstants.js');
    expect(signIn).toMatch(/REFRESH_TOKEN: 'refreshToken'/);
    expect(signIn).toMatch(/tokens\.refreshToken/);
    expect(registerConstants).toMatch(/REFRESH_TOKEN: 'refreshToken'/);
    expect(register).toMatch(/refreshToken/);
  });

  it('backend expone POST /api/auth/refresh con refreshToken en body', () => {
    const src = readRepo('backend/routes/authRoutes.js');
    expect(src).toMatch(/router\.post\('\/refresh'/);
    expect(src).toMatch(/refreshToken/);
    expect(src).toMatch(/accessToken/);
  });
});
