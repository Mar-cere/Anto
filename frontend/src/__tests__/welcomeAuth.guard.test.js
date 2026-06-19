/**
 * Blindaje: bienvenida rediseñada y sesión persistente al abrir la app.
 */
import fs from 'fs';
import path from 'path';

const FRONTEND_SRC = path.resolve(__dirname, '..');

function readSrc(relativePath) {
  return fs.readFileSync(path.join(FRONTEND_SRC, relativePath), 'utf8');
}

describe('welcomeAuth guard', () => {
  it('HomeScreen usa copy del mock y no muestra chat de emergencia', () => {
    const src = readSrc('screens/HomeScreen.js');
    expect(src).toMatch(/HEADLINE_ACCENT/);
    expect(src).toMatch(/START_FREE/);
    expect(src).toMatch(/ALREADY_HAVE_ACCOUNT/);
    expect(src).toMatch(/ROUTES\.REGISTER/);
    expect(src).toMatch(/ROUTES\.SIGN_IN/);
    expect(src).not.toMatch(/EMERGENCY_CHAT/);
    expect(src).not.toMatch(/emergency/i);
    expect(src).not.toMatch(/AnimatedButton/);
    expect(src).not.toMatch(/ParticleBackground/);
    expect(src).not.toMatch(/back\.png/);
  });

  it('HomeScreen mantiene testIDs de E2E y espera carga de auth', () => {
    const src = readSrc('screens/HomeScreen.js');
    expect(src).toMatch(/testID="home-welcome-title"/);
    expect(src).toMatch(/testID="home-sign-in-button"/);
    expect(src).toMatch(/testID="home-start-free-button"/);
    expect(src).toMatch(/useAuth\(\)/);
    expect(src).toMatch(/authLoading/);
  });

  it('AuthNavigationSync restaura MainTabs solo con sesión activa', () => {
    const syncSrc = readSrc('navigation/AuthNavigationSync.js');
    const navSrc = readSrc('navigation/AppNavigator.js');
    const authSrc = readSrc('context/AuthContext.js');
    expect(syncSrc).toMatch(/navigationRef\.reset/);
    expect(syncSrc).toMatch(/MAIN_TABS/);
    expect(syncSrc).toMatch(/!user/);
    expect(syncSrc).toMatch(/didRestore/);
    expect(navSrc).toMatch(/AuthNavigationSync/);
    expect(authSrc).toMatch(/userToken/);
    expect(authSrc).toMatch(/userData/);
  });

  it('SignInScreen sigue reseteando a MainTabs tras login exitoso', () => {
    const src = readSrc('screens/SignInScreen.js');
    expect(src).toMatch(/ROUTES\.MAIN_TABS/);
    expect(src).toMatch(/navigation\.reset/);
  });
});
