/**
 * Paridad onboarding focus: backend ↔ mirror frontend.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ONBOARDING_FOCUS_LABELS } from '../../../constants/onboardingFocusLabels.js';

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const frontendMirrorPath = path.join(
  workspaceRoot,
  'frontend/src/constants/onboardingFocusLabels.js',
);

describe('onboardingFocusLabels parity guard', () => {
  it('el mirror del frontend existe y contiene todas las etiquetas del backend', () => {
    const mirrorSrc = fs.readFileSync(frontendMirrorPath, 'utf8');
    const allLabels = [
      ...ONBOARDING_FOCUS_LABELS.es,
      ...ONBOARDING_FOCUS_LABELS.en,
    ];
    for (const label of allLabels) {
      expect(mirrorSrc).toContain(label);
    }
  });
});
