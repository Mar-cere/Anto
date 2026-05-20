import { userApiCopy } from '../../../utils/userApiCopy.js';

describe('userApiCopy', () => {
  it('expone mensajes en inglés', () => {
    const copy = userApiCopy('en');
    expect(copy.notAuthenticated).toBe('User not authenticated');
    expect(copy.emergencyContactsLimit).toMatch(/limit of 2/);
    expect(copy.testAlertSent(1, 2, 1)).toMatch(/1\/2/);
  });

  it('expone mensajes en español', () => {
    const copy = userApiCopy('es');
    expect(copy.profileUpdated).toMatch(/actualizado/i);
    expect(copy.contactToggleEnabled).toMatch(/habilitado/i);
  });
});
