/** Eventos Socket.IO de chat — deben coincidir con backend/config/socket.js */
export const CHAT_SOCKET_EVENTS = {
  AUTHENTICATE: 'authenticate',
  MESSAGE: 'message',
  MESSAGE_SENT: 'message:sent',
  MESSAGE_RECEIVED: 'message:received',
  AI_TYPING: 'ai:typing',
  CANCEL_RESPONSE: 'cancel:response',
  ERROR: 'error',
  EMERGENCY_ALERT_SENT: 'emergency:alert:sent',
  EMERGENCY_ALERT_UPDATED: 'emergency:alert:updated',
};
