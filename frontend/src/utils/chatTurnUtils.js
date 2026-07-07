export function countNonemptyUserTurns(messageList) {
  return (messageList || []).filter(
    (m) => m.role === 'user' && String(m.content || '').trim().length > 0,
  ).length;
}

/** True si el hilo tiene al menos un turno del usuario con contenido (excluye quickReplies). */
export function hasNonemptyUserTurns(messageList) {
  return (messageList || []).some(
    (m) =>
      m?.role === 'user' &&
      m?.type !== 'quickReplies' &&
      String(m?.content || '').trim().length > 0,
  );
}
