/**
 * Tono neutro del copy del lienzo ABC macro (#212) — paridad con copyToneGuards.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { hasSpanishVoseo } from '../../../utils/copyToneGuards.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function readSource(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

describe('abcMacroCycleCopy tone (#212)', () => {
  const copySrc = readSource('../frontend/src/components/abc/abcMacroCycleCopy.js');

  it('exploreHint e intervenciones es sin voseo en fuente', () => {
    const esBlock = copySrc.match(/es:\s*\{[\s\S]*?\n\s*\},\n\s*en:/);
    expect(esBlock).toBeTruthy();
    const block = esBlock[0];
    const strings = [...block.matchAll(/'([^'\\]|\\.)*'/g)].map((m) => m[0].slice(1, -1));
    const offenders = strings.filter((s) => s.length > 8 && hasSpanishVoseo(s));
    expect(offenders).toEqual([]);
  });

  it('solo AbcRecordScreen activa showCycleVisual interactivo', () => {
    const abcScreen = readSource('../frontend/src/screens/techniques/AbcRecordScreen.js');
    const summaryScreen = readSource('../frontend/src/screens/SummaryScreen.js');
    const weeklyScreen = readSource('../frontend/src/screens/WeeklyInsightScreen.js');
    expect(abcScreen).toMatch(/showCycleVisual/);
    expect(summaryScreen).not.toMatch(/showCycleVisual/);
    expect(weeklyScreen).not.toMatch(/showCycleVisual/);
  });
});
