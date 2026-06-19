import {
  getSoftPriorityStyle,
  SOFT_ATTENTION_PALETTE,
  SOFT_PRIORITY_PALETTE,
} from '../taskPriorityPalette';

describe('taskPriorityPalette', () => {
  it('expone prioridades suaves distintas', () => {
    expect(SOFT_PRIORITY_PALETTE.high.color).not.toBe(SOFT_PRIORITY_PALETTE.medium.color);
    expect(SOFT_PRIORITY_PALETTE.medium.color).not.toBe(SOFT_PRIORITY_PALETTE.low.color);
  });

  it('getSoftPriorityStyle cae en media por defecto', () => {
    expect(getSoftPriorityStyle('unknown').color).toBe(SOFT_PRIORITY_PALETTE.medium.color);
  });

  it('paleta de atención evita rojo error puro', () => {
    expect(SOFT_ATTENTION_PALETTE.color.toLowerCase()).not.toBe('#ff0000');
    expect(SOFT_ATTENTION_PALETTE.border).toMatch(/rgba/i);
  });
});
