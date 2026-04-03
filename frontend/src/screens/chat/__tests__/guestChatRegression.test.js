/**
 * Regresión UI/copys del modo invitado (banner de cuota alineado con backend).
 */

jest.mock('../../../styles/globalStyles', () => ({
  colors: {
    background: '#030A24',
    primary: '#1ADDDB',
    white: '#FFFFFF',
  },
}));

jest.mock('react-native', () => ({
  Dimensions: {
    get: jest.fn(() => ({ width: 390, height: 844 })),
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
