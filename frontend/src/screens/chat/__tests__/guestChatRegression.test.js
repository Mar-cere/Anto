/**
 * Regresión UI/copys del modo invitado (banner de cuota alineado con backend).
 */

jest.mock('../../../styles/globalStyles', () => jest.requireActual('../../../styles/globalStyles'));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios', select: (d) => d.ios, isPad: false, isTVOS: false },
  Dimensions: {
    get: jest.fn(() => ({ width: 390, height: 844 })),
  },
  StyleSheet: {
    hairlineWidth: 0.5,
    create: (styles) => styles,
    absoluteFillObject: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  },
}));

import { formatGuestQuotaBanner, GUEST_MAX_USER_MESSAGES } from '../chatScreenConstants';

describe('Guest chat — regresión UI', () => {
  it('GUEST_MAX_USER_MESSAGES debe ser 5 (alineado con backend guestChat.js)', () => {
    expect(GUEST_MAX_USER_MESSAGES).toBe(5);
  });

  it('formatGuestQuotaBanner refleja restantes y máximo', () => {
    expect(formatGuestQuotaBanner(5, 5)).toBe('Modo sin cuenta · 5 de 5 mensajes restantes');
    expect(formatGuestQuotaBanner(0, 5)).toBe('Modo sin cuenta · 0 de 5 mensajes restantes');
    expect(formatGuestQuotaBanner(3, 5)).toBe('Modo sin cuenta · 3 de 5 mensajes restantes');
  });
});
