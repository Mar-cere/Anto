import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(__dirname, '../../../scripts/audit-api-routes-i18n.mjs');

describe('apiRoutesI18nAudit', () => {
  it('no deja message/error en español hardcodeado en routes', () => {
    const output = execSync(`node "${script}"`, { encoding: 'utf8' });
    expect(output).toMatch(/audit OK/i);
  });
});
