#!/usr/bin/env node
import { runTherapeuticTechniquesEnAudit } from '../utils/therapeuticTechniquesEnAudit.mjs';

const result = runTherapeuticTechniquesEnAudit();
if (!result.ok) {
  console.error('Therapeutic techniques EN audit failed:', result.issues.slice(0, 20));
  process.exit(1);
}
console.log(`OK: ${result.checked} strings checked`);
