#!/usr/bin/env node
import { runPsychoeducationEnAudit } from '../utils/psychoeducationEnAudit.mjs';

const result = runPsychoeducationEnAudit();
if (!result.ok) {
  console.error('Psychoeducation EN audit failed:', result.issues.slice(0, 20));
  process.exit(1);
}
console.log(`OK: ${result.checked} strings checked`);
