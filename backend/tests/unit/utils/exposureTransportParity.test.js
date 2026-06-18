/**
 * Paridad guardas exposición (#87 / #190): rutas ↔ utilidades ↔ UI.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function readSource(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

describe('exposure transport parity (#87 / #190)', () => {
  const routesSrc = readSource('routes/exposurePlanRoutes.js');
  const screenSrc = readSource('../frontend/src/screens/techniques/ExposureHierarchyScreen.js');

  it('rutas usan guardas y códigos de error estables', () => {
    expect(routesSrc).toMatch(/evaluateLogExposureAttempt/);
    expect(routesSrc).toMatch(/evaluateCompleteExposureStep/);
    expect(routesSrc).toMatch(/buildExposureGuardErrorBody/);
  });

  it('pantalla usa confirmación de avance y requisito de intento', () => {
    expect(screenSrc).toMatch(/buildExposureAdvanceConfirmCopy/);
    expect(screenSrc).toMatch(/canMarkExposureStepComplete/);
    expect(screenSrc).toMatch(/resolveExposurePlanErrorMessage/);
  });
});
