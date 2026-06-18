/**
 * Paridad BA (#88): chat ↔ plan semanal ↔ producto.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function readSource(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

describe('BA transport parity (#88)', () => {
  const baRoutesSrc = readSource('routes/behavioralActivationRoutes.js');
  const taskRoutesSrc = readSource('routes/taskRoutes.js');
  const habitRoutesSrc = readSource('routes/habitRoutes.js');
  const screenSrc = readSource('../frontend/src/screens/techniques/BehavioralActivationScreen.js');

  it('rutas BA reconcilian plan y exponen sync desde log', () => {
    expect(baRoutesSrc).toMatch(/reconcileWeekPlanWithLinkedProducts/);
    expect(baRoutesSrc).toMatch(/week-plan\/sync-from-log/);
    expect(baRoutesSrc).toMatch(/week-plan\/link-product/);
    expect(baRoutesSrc).toMatch(/buildBaBridgeErrorBody/);
  });

  it('tareas y hábitos sincronizan slot BA al completar', () => {
    expect(taskRoutesSrc).toMatch(/syncBaSlotFromProductCompletion/);
    expect(habitRoutesSrc).toMatch(/syncBaSlotFromProductCompletion/);
  });

  it('pantalla BA usa plan semanal y endpoints de sync', () => {
    expect(screenSrc).toMatch(/BEHAVIORAL_ACTIVATION_WEEK_PLAN/);
    expect(screenSrc).toMatch(/BEHAVIORAL_ACTIVATION_WEEK_PLAN_LINK/);
    expect(screenSrc).toMatch(/BEHAVIORAL_ACTIVATION_WEEK_PLAN_SYNC/);
    expect(screenSrc).toMatch(/resolveBaApiErrorMessage/);
  });
});
