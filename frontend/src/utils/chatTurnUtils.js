export function countNonemptyUserTurns(messageList) {
  return (messageList || []).filter(
    (m) => m.role === 'user' && String(m.content || '').trim().length > 0,
  ).length;
}
