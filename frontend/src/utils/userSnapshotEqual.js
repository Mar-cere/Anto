/**
 * Compara snapshots de usuario para evitar setState innecesario en AuthContext.
 * Evita cascadas: applyLocalUser → nuevo `user` → useFocusEffect/callbacks inestables.
 */

export function getUserSnapshotId(user) {
  if (!user || typeof user !== 'object') return null;
  const id = user._id ?? user.id;
  if (id == null || id === '') return null;
  return String(id);
}

/**
 * @param {object|null|undefined} prev
 * @param {object|null|undefined} next
 * @returns {boolean}
 */
export function areUserSnapshotsEqual(prev, next) {
  if (prev === next) return true;
  if (!prev || !next || typeof prev !== 'object' || typeof next !== 'object') return false;
  const prevId = getUserSnapshotId(prev);
  const nextId = getUserSnapshotId(next);
  if (!prevId || !nextId || prevId !== nextId) return false;
  try {
    return JSON.stringify(prev) === JSON.stringify(next);
  } catch {
    return false;
  }
}
