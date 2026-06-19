/** Paleta suave de prioridad y atención — alineada con bienestar, sin rojo punitivo. */

export const SOFT_PRIORITY_PALETTE = {
  high: {
    color: '#C75B5B',
    border: 'rgba(199, 91, 91, 0.32)',
    bg: 'rgba(199, 91, 91, 0.1)',
  },
  medium: {
    color: '#B8864A',
    border: 'rgba(184, 134, 74, 0.32)',
    bg: 'rgba(184, 134, 74, 0.1)',
  },
  low: {
    color: '#5A9B72',
    border: 'rgba(90, 155, 114, 0.32)',
    bg: 'rgba(90, 155, 114, 0.1)',
  },
};

export const SOFT_ATTENTION_PALETTE = {
  color: '#B8864A',
  border: 'rgba(184, 134, 74, 0.28)',
  bg: 'rgba(184, 134, 74, 0.07)',
  pillBg: 'rgba(184, 134, 74, 0.12)',
  pillBorder: 'rgba(184, 134, 74, 0.24)',
};

export function getSoftPriorityStyle(priority) {
  return SOFT_PRIORITY_PALETTE[priority] || SOFT_PRIORITY_PALETTE.medium;
}
