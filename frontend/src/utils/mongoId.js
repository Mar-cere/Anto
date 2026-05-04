/**
 * ObjectId Mongo de 24 hex (mensajes / conversaciones en cliente).
 * @param {unknown} id
 * @returns {boolean}
 */
export function isValidMongoObjectId24(id) {
  const s = id != null ? String(id) : '';
  return /^[a-f0-9]{24}$/i.test(s);
}
