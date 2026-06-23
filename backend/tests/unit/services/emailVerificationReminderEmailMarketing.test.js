import { describe, it, expect } from '@jest/globals';
import { getEmailVerificationReminderAfterHours } from '../../../constants/email.js';
import {
  buildEmailVerificationReminderBaseFilter,
  validateUserForEmailVerificationReminderSend,
} from '../../../services/emailMarketingService.js';

describe('buildEmailVerificationReminderBaseFilter', () => {
  it('exige registro anterior a la ventana y email sin verificar', () => {
    const now = new Date('2026-06-10T12:00:00.000Z');
    const f = buildEmailVerificationReminderBaseFilter(now, 24);
    expect(f.emailVerified).toBe(false);
    expect(f.isActive).toBe(true);
    expect(f.createdAt.$lte).toEqual(new Date('2026-06-09T12:00:00.000Z'));
    expect(f.$or).toHaveLength(2);
  });

  it('usa default de 24 h si afterHours es inválido', () => {
    const now = new Date('2026-06-10T12:00:00.000Z');
    const f = buildEmailVerificationReminderBaseFilter(now, NaN);
    const expectedHours = getEmailVerificationReminderAfterHours();
    expect(f.createdAt.$lte).toEqual(
      new Date(now.getTime() - expectedHours * 60 * 60 * 1000),
    );
  });
});

describe('validateUserForEmailVerificationReminderSend', () => {
  it('rechaza email inválido o ya verificado', () => {
    expect(validateUserForEmailVerificationReminderSend({ email: 'mal' }).ok).toBe(false);
    expect(
      validateUserForEmailVerificationReminderSend({ email: 'a@b.co', emailVerified: true }).ok,
    ).toBe(false);
  });

  it('acepta email válido sin verificar', () => {
    const r = validateUserForEmailVerificationReminderSend({
      email: 'a@b.co',
      emailVerified: false,
      username: 'ana',
    });
    expect(r.ok).toBe(true);
    expect(r.username).toBe('ana');
  });
});
