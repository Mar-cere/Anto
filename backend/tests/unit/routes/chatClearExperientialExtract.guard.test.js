/**
 * Guard: borrar conversación agenda extract con snapshot antes de deleteMany.
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const readSrc = (rel) =>
  readFileSync(join(__dirname, '../../../', rel), 'utf8');

describe('chat clear → experiential extract snapshot (guard)', () => {
  it('DELETE conversación agenda scheduleExperientialPatternExtract con captureSnapshot', () => {
    const src = readSrc('routes/chatRoutes.js');
    expect(src).toMatch(/scheduleExperientialPatternExtract/);
    expect(src).toMatch(/captureSnapshot:\s*true/);
    const deleteIdx = src.indexOf("router.delete('/conversations/:conversationId'");
    const scheduleIdx = src.indexOf('scheduleExperientialPatternExtract', deleteIdx);
    const deleteManyIdx = src.indexOf('Message.deleteMany', deleteIdx);
    expect(deleteIdx).toBeGreaterThan(-1);
    expect(scheduleIdx).toBeGreaterThan(deleteIdx);
    expect(deleteManyIdx).toBeGreaterThan(scheduleIdx);
  });
});
