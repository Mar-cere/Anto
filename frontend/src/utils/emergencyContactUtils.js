/**
 * Identificadores de contactos de emergencia: el backend (Mongoose) usa `_id`;
 * algunas respuestas o datos en caché pueden exponer solo `id`.
 */

export function getEmergencyContactId(contact) {
  if (!contact || typeof contact !== 'object') return '';
  const raw = contact._id ?? contact.id;
  if (raw == null || raw === '') return '';
  return String(raw);
}

export function normalizeEmergencyContact(contact) {
  if (!contact || typeof contact !== 'object') return contact;
  const id = getEmergencyContactId(contact);
  if (!id) return contact;
  return { ...contact, _id: contact._id ?? id };
}

export function normalizeEmergencyContactsList(contacts) {
  if (!Array.isArray(contacts)) return [];
  return contacts.map(normalizeEmergencyContact);
}
