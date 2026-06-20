/**
 * Blindaje release 1.5.0 — versión, builds, rendimiento home y paywall header.
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

describe('release 1.5.0 guard', () => {
  it('frontend alinea versión 1.5.0 y builds de tienda mínimos', () => {
    const app = JSON.parse(readRepo('frontend/app.json'));
    const pkg = JSON.parse(readRepo('frontend/package.json'));
    expect(app.expo.version).toBe('1.5.0');
    expect(pkg.version).toBe('1.5.0');
    expect(Number.parseInt(app.expo.ios.buildNumber, 10)).toBeGreaterThanOrEqual(39);
    expect(app.expo.android.versionCode).toBeGreaterThanOrEqual(25);
  });

  it('backend expone APP_VERSION 1.5.0 en health y package', () => {
    const server = readRepo('backend/server.js');
    const pkg = JSON.parse(readRepo('backend/package.json'));
    expect(server).toMatch(/const APP_VERSION = '1\.5\.0'/);
    expect(pkg.version).toBe('1.5.0');
  });

  it('DashScreen no bloquea UI por WebSocket y throttlea refresh al volver', () => {
    const src = readSrc('screens/DashScreen.js');
    expect(src).toMatch(/shouldRefreshHomeOnFocus/);
    expect(src).toMatch(/mergeFocusResponse/);
    expect(src).toMatch(/lastHomeRefreshAtRef/);
    expect(src).toMatch(/refreshHomeDataOnFocus\(\{ force: true \}\)/);
    expect(src).not.toMatch(/await websocketService\.connect/);
    const loadBlock = src.slice(src.indexOf('const loadData'), src.indexOf('const getNotificationsPromptKey'));
    const loadingIdx = loadBlock.indexOf('setLoading(false)');
    const connectIdx = loadBlock.indexOf('websocketService.connect');
    expect(loadingIdx).toBeGreaterThan(-1);
    expect(connectIdx).toBeGreaterThan(-1);
    expect(loadingIdx).toBeLessThan(connectIdx);
    const refreshBlock = src.slice(
      src.indexOf('const refreshHomeDataOnFocus'),
      src.indexOf('const openConversationFromFocus'),
    );
    expect(refreshBlock).toMatch(/ENDPOINTS\.TASKS/);
    expect(refreshBlock).toMatch(/ENDPOINTS\.HABITS/);
    expect(refreshBlock).toMatch(/ENDPOINTS\.SUMMARY_FOCUS/);
    expect(refreshBlock).not.toMatch(/ENDPOINTS\.ME/);
  });

  it('Header paywall: title vacío no muestra «Bienvenido» ni perfil', () => {
    const src = readSrc('components/Header.js');
    expect(src).toMatch(/if \(showBackButton && !title\)/);
    expect(src).toMatch(/greeting !== undefined && greeting !== null/);
    const paywallBlock = src.slice(src.indexOf('if (showBackButton && !title)'), src.indexOf('if (title && showBackButton)'));
    expect(paywallBlock).not.toMatch(/HEADER_DEFAULT_GREETING/);
    expect(paywallBlock).not.toMatch(/profileButton/);
  });

  it('Instagram por idioma en settings y constantes', () => {
    const social = readSrc('constants/socialLinks.js');
    const settings = readSrc('components/settings/SettingsContent.js');
    expect(social).toMatch(/resolveInstagramUrl/);
    expect(social).toMatch(/antoapp\.es/);
    expect(social).toMatch(/antoapp\.en/);
    expect(settings).toMatch(/resolveInstagramUrl/);
  });

  it('EAS production desactiva upload de source maps de Sentry sin org/token', () => {
    const eas = JSON.parse(readRepo('frontend/eas.json'));
    const app = JSON.parse(readRepo('frontend/app.json'));
    expect(eas.build.production.env.SENTRY_DISABLE_AUTO_UPLOAD).toBe('true');
    expect(eas.build.preview.env.SENTRY_DISABLE_AUTO_UPLOAD).toBe('true');
    const sentryPlugin = app.expo.plugins.find(
      (p) => Array.isArray(p) && String(p[0]).includes('sentry'),
    );
    expect(sentryPlugin?.[1]?.disableAutoUpload).toBe(true);
  });
});
