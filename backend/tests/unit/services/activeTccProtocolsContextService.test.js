/**
 * Tests — puente chat ↔ protocolos TCC (#6).
 */
import {
  buildActiveTccProtocolsPromptSnippet,
  pickActiveExposureStep,
  pickNextBaWeekSlot,
} from '../../../services/activeTccProtocolsContextService.js';

describe('activeTccProtocolsContextService', () => {
  it('pickNextBaWeekSlot elige la pendiente más temprana', () => {
    const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const next = pickNextBaWeekSlot(
      {
        slots: [
          { dayOffset: 4, status: 'planned', activityDescription: 'Tardea' },
          { dayOffset: 1, status: 'planned', activityDescription: 'Temprana' },
          { dayOffset: 2, status: 'completed', activityDescription: 'Hecha' },
        ],
      },
      dayLabels,
    );
    expect(next?.activityDescription).toBe('Temprana');
    expect(next?.dayLabel).toBe('Mar');
    expect(next?.pendingCount).toBe(2);
  });

  it('pickActiveExposureStep prioriza in_progress', () => {
    const step = pickActiveExposureStep({
      steps: [
        { status: 'pending', description: 'A' },
        { status: 'in_progress', description: 'B' },
      ],
    });
    expect(step?.description).toBe('B');
  });

  it('buildActiveTccProtocolsPromptSnippet devuelve null sin userId', async () => {
    await expect(buildActiveTccProtocolsPromptSnippet({ userId: null })).resolves.toBeNull();
  });
});
