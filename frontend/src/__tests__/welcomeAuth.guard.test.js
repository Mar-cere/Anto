/**
 * Blindaje: bienvenida, bootstrap de sesión, tema claro/oscuro y carga de marca.
 */
import fs from 'fs';
import path from 'path';

const FRONTEND_SRC = path.resolve(__dirname, '..');
const FRONTEND_ROOT = path.resolve(FRONTEND_SRC, '..');

function readSrc(relativePath) {
  return fs.readFileSync(path.join(FRONTEND_SRC, relativePath), 'utf8');
}

function readRoot(relativePath) {
  return fs.readFileSync(path.join(FRONTEND_ROOT, relativePath), 'utf8');
}

describe('welcomeAuth guard', () => {
  it('App.tsx no monta toast de conexión restaurada', () => {
    const src = readRoot('App.tsx');
    expect(src).not.toMatch(/ConnectionRestoredListener/);
    expect(fs.existsSync(path.join(FRONTEND_SRC, 'components/ConnectionRestoredListener.js'))).toBe(
      false,
    );
  });

  it('HomeScreen adapta copy, logo y colores al tema claro/oscuro', () => {
    const src = readSrc('screens/HomeScreen.js');
    expect(src).toMatch(/useTheme/);
    expect(src).toMatch(/getWelcomeScreenTheme/);
    expect(src).toMatch(/theme\.logo/);
    expect(src).toMatch(/statusBarStyle/);
    expect(src).not.toMatch(/WELCOME_COLORS/);
    expect(src).not.toMatch(/light-content/);
    expect(src).not.toMatch(/PaywallBrandOrb/);
    expect(src).toMatch(/WelcomeBrandBackdrop/);
    expect(src).toMatch(/ParticleBackground/);
    expect(src).not.toMatch(/EMERGENCY_CHAT/);
    expect(src).not.toMatch(/useAuth\(\)/);
  });

  it('HomeScreen mantiene CTAs del mock y testIDs de E2E', () => {
    const src = readSrc('screens/HomeScreen.js');
    expect(src).toMatch(/HEADLINE_ACCENT/);
    expect(src).toMatch(/START_FREE/);
    expect(src).toMatch(/ALREADY_HAVE_ACCOUNT/);
    expect(src).toMatch(/ROUTES\.REGISTER/);
    expect(src).toMatch(/ROUTES\.SIGN_IN/);
    expect(src).toMatch(/testID="home-welcome-title"/);
    expect(src).toMatch(/testID="home-sign-in-button"/);
    expect(src).toMatch(/testID="home-start-free-button"/);
  });

  it('WelcomeBrandBackdrop usa halos según tema activo', () => {
    const src = readSrc('components/welcome/WelcomeBrandBackdrop.js');
    expect(src).toMatch(/useTheme/);
    expect(src).toMatch(/resolvedScheme/);
    expect(src).toMatch(/getHaloLayers/);
    expect(src).not.toMatch(/'dark'/);
  });

  it('AppNavigator bootstrap evita bienvenida antes de restaurar sesión', () => {
    const src = readSrc('navigation/AppNavigator.js');
    expect(src).toMatch(/loading/);
    expect(src).toMatch(/BrandLoadingView/);
    expect(src).toMatch(/testID="app-auth-bootstrap"/);
    expect(src).toMatch(/initialRouteName/);
    expect(src).toMatch(/ROUTES\.MAIN_TABS/);
    expect(src).toMatch(/ROUTES\.HOME/);
    expect(src).not.toMatch(/AuthNavigationSync/);
    expect(fs.existsSync(path.join(FRONTEND_SRC, 'navigation/AuthNavigationSync.js'))).toBe(false);
  });

  it('StackNavigator acepta ruta inicial dinámica sin animación en MainTabs', () => {
    const stackSrc = readSrc('navigation/StackNavigator.js');
    const routesSrc = readSrc('constants/routes.js');
    expect(stackSrc).toMatch(/initialRouteName = ROUTE_NAMES\.HOME/);
    expect(stackSrc).toMatch(/animation: 'none'/);
    expect(routesSrc).toMatch(/HOME: 'Home'/);
  });

  it('DashScreen usa BrandLoadingView durante carga real inicial', () => {
    const src = readSrc('screens/DashScreen.js');
    expect(src).toMatch(/BrandLoadingView/);
    expect(src).not.toMatch(/SkeletonCard/);
    expect(src).toMatch(/setLoading\(false\)/);
  });

  it('BrandLoadingView y welcomeScreenTheme comparten logo por tema', () => {
    const loadingSrc = readSrc('components/common/BrandLoadingView.js');
    const themeSrc = readSrc('utils/welcomeScreenTheme.js');
    expect(loadingSrc).toMatch(/getWelcomeScreenTheme/);
    expect(themeSrc).toMatch(/icon\.png/);
    expect(themeSrc).toMatch(/Anto\.png/);
  });
});
