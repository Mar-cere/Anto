/**
 * Blindaje: auditoría push EN en CI.
 */
import { runPushEnAudit, isSpanishish } from '../../../utils/pushCopyEnAudit.mjs';
import { PUSH_NOTIFICATION_COPY_EN } from '../../../services/pushNotificationCopyPools.en.js';

describe('pushCopyEnAudit', () => {
  it('pool EN pasa auditoría estructural', async () => {
    const { ok, report } = await runPushEnAudit(PUSH_NOTIFICATION_COPY_EN);
    if (!ok) {
      const detail = JSON.stringify(report.counts, null, 2);
      throw new Error(`push EN audit failed: ${detail}`);
    }
    expect(ok).toBe(true);
    expect(report.counts.spanishFallbacks).toBe(0);
    expect(report.counts.sampleLeak).toBe(0);
    expect(report.missingKeys).toHaveLength(0);
  });

  it('detecta español en fallbacks', () => {
    expect(isSpanishish('Tu tarea')).toBe(true);
    expect(isSpanishish('Your task')).toBe(false);
  });

  it('taskDueSoon EN sin fallbacks españoles', () => {
    const text = PUSH_NOTIFICATION_COPY_EN.taskDueSoon
      .bodies('Homework', 'tomorrow')
      .join(' ');
    expect(text).toMatch(/Homework/);
    expect(text).not.toMatch(/\bTu tarea\b/i);
    expect(text).not.toMatch(/\bpronto\b/i);
  });

  it('progressPositive EN sin fallbacks españoles', () => {
    const text = PUSH_NOTIFICATION_COPY_EN.progressPositive.bodies('milestone').join(' ');
    expect(text).toMatch(/milestone/);
    expect(text).not.toMatch(/\besto\b/i);
    expect(text).not.toMatch(/sigue construyendo/i);
  });
});
