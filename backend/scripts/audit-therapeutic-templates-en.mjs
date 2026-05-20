#!/usr/bin/env node
import { runTherapeuticTemplatesEnAudit } from '../utils/therapeuticTemplatesEnAudit.mjs';

const result = runTherapeuticTemplatesEnAudit();
if (!result.ok) {
  console.error('Therapeutic templates EN audit failed:', result.issues.slice(0, 15));
  process.exit(1);
}
console.log(`OK: ${result.checked} strings checked`);
