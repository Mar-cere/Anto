import { describe, expect, it } from '@jest/globals';
import { estimateChatStripReserveHeight } from '../chatStripStyles';

describe('chatStripStyles', () => {
  it('no reserva espacio sin franjas visibles', () => {
    expect(estimateChatStripReserveHeight()).toBe(0);
  });

  it('suma altura por cada franja activa', () => {
    const oneTcc = estimateChatStripReserveHeight({ tccContinuityCount: 1 });
    const twoTcc = estimateChatStripReserveHeight({ tccContinuityCount: 2 });
    expect(twoTcc).toBeGreaterThan(oneTcc);

    const mixed = estimateChatStripReserveHeight({
      tccContinuityCount: 1,
      softCrisisActive: true,
      tccLiteHandoff: true,
    });
    expect(mixed).toBeGreaterThan(oneTcc);
  });
});
