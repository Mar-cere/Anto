import {
  getEmergencyContactId,
  normalizeEmergencyContact,
  normalizeEmergencyContactsList,
} from '../emergencyContactUtils';

describe('emergencyContactUtils', () => {
  it('getEmergencyContactId prioriza _id y admite id', () => {
    expect(getEmergencyContactId({ _id: 'abc' })).toBe('abc');
    expect(getEmergencyContactId({ id: 'xyz' })).toBe('xyz');
    expect(getEmergencyContactId({ _id: 'a', id: 'b' })).toBe('a');
    expect(getEmergencyContactId(null)).toBe('');
  });

  it('normalizeEmergencyContact asigna _id desde id', () => {
    expect(normalizeEmergencyContact({ id: '1', name: 'N' })).toEqual({
      id: '1',
      _id: '1',
      name: 'N',
    });
  });

  it('normalizeEmergencyContactsList devuelve array vacío si no es array', () => {
    expect(normalizeEmergencyContactsList(undefined)).toEqual([]);
    expect(normalizeEmergencyContactsList(null)).toEqual([]);
  });
});
