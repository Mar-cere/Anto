import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { listCatalogInterventionIds } from '../../../constants/interventionCatalog.js';
import { INTERVENTION_LABELS_EN } from '../../../constants/interventionCatalogLabels.en.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendEnPath = join(
  __dirname,
  '../../../../frontend/src/constants/interventionCatalogLabels.en.js',
);

describe('interventionCatalogLabels parity frontend/backend', () => {
  it('frontend espeja las claves del backend', () => {
    const raw = readFileSync(frontendEnPath, 'utf8');
    const ids = listCatalogInterventionIds();
    ids.forEach((id) => {
      expect(INTERVENTION_LABELS_EN[id]).toBeTruthy();
      expect(raw).toContain(`${id}:`);
    });
  });
});
