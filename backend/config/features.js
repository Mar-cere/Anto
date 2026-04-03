/**
 * Feature flags centralizados (backend).
 *
 * Lectura: variables de entorno en el momento de cargar el módulo.
 * El punto de entrada (`server.js`) debe importar `./config/config.js` antes
 * para que `dotenv` aplique.
 *
 * | Flag (objeto)              | Variable ENV                    | Default | Notas |
 * |----------------------------|--------------------------------|---------|-------|
 * | reminders                  | ENABLE_REMINDERS               | activo  | `false` desactiva |
 * | crisisFollowUp             | ENABLE_CRISIS_FOLLOWUP         | activo  | seguimiento post-crisis |
 * | intenseChatCheckIn         | ENABLE_INTENSE_CHAT_CHECKIN    | activo  | check-ins poschat |
 * | notificationScheduler      | ENABLE_NOTIFICATION_SCHEDULER  | activo  | cola de notificaciones |
 * | openaiDailyCostReport      | ENABLE_OPENAI_DAILY_COST_REPORT | activo | correo diario uso OpenAI |
 * | swagger                    | ENABLE_SWAGGER + NODE_ENV      | ver abajo | en prod solo si `ENABLE_SWAGGER=true` |
 *
 * Para los cuatro primeros, cualquier valor distinto de la cadena `'false'`
 * se interpreta como activado (comportamiento histórico del servidor).
 */

/**
 * @param {string | undefined} value
 * @returns {boolean}
 */
function envIsNotFalse(value) {
  return value !== 'false';
}

/**
 * Documentación OpenAPI (`/api-docs`).
 * En desarrollo: habilitado salvo que se restrinja en el futuro.
 * En producción: solo si ENABLE_SWAGGER === 'true'.
 */
function resolveSwaggerEnabled() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv !== 'production') {
    return true;
  }
  return process.env.ENABLE_SWAGGER === 'true';
}

export const features = Object.freeze({
  reminders: envIsNotFalse(process.env.ENABLE_REMINDERS),
  crisisFollowUp: envIsNotFalse(process.env.ENABLE_CRISIS_FOLLOWUP),
  intenseChatCheckIn: envIsNotFalse(process.env.ENABLE_INTENSE_CHAT_CHECKIN),
  notificationScheduler: envIsNotFalse(process.env.ENABLE_NOTIFICATION_SCHEDULER),
  openaiDailyCostReport: envIsNotFalse(process.env.ENABLE_OPENAI_DAILY_COST_REPORT),
  swagger: resolveSwaggerEnabled(),
});

export default features;
