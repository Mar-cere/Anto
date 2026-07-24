/**
 * Feature flags centralizados (backend).
 *
 * Lectura: variables de entorno en el momento de cargar el módulo.
 * El punto de entrada (`server.js`) debe importar `./config/config.js` antes
 * para que `dotenv` aplique.
 *
 * | Flag (objeto)              | Variable ENV                    | Default | Notas |
 * |----------------------------|--------------------------------|---------|-------|
 * | reminders                  | ENABLE_REMINDERS               | off     | correos periódicos “revisa contactos de emergencia”; solo si `true` |
 * | crisisFollowUp             | ENABLE_CRISIS_FOLLOWUP         | activo  | seguimiento post-crisis |
 * | intenseChatCheckIn         | ENABLE_INTENSE_CHAT_CHECKIN    | activo  | check-ins poschat |
 * | notificationScheduler      | ENABLE_NOTIFICATION_SCHEDULER  | activo  | cola de notificaciones; tunear espaciado con `NOTIFICATION_*` en `notificationScheduler.js` |
 * | openaiDailyCostReport      | ENABLE_OPENAI_DAILY_COST_REPORT | activo | correo diario uso OpenAI |
 * | trialRetentionEmail        | ENABLE_TRIAL_RETENTION_EMAIL   | activo | correo ~12 h tras inicio de trial corto (1 día) |
 * | emailVerificationReminder  | ENABLE_EMAIL_VERIFICATION_REMINDER | activo | recordatorio ~24 h tras registro sin verificar (valor + invitación, sin código) |
 * | weeklySummaryEmail         | ENABLE_WEEKLY_SUMMARY_EMAIL o ENABLE_WEEKLY_TIPS_EMAIL | off | aviso resumen semanal (neutro); slot `WEEKLY_TIPS_EMAIL_SLOT`; regalo trial +N días tras envío: `WEEKLY_SUMMARY_TRIAL_GIFT_DAYS` (default: 1 si APP_TRIAL_DAYS≤1, si no min(2, APP_TRIAL_DAYS)), desactivar con `WEEKLY_SUMMARY_TRIAL_GIFT_ENABLED=false` |
 * | lastSessionSummaryWorker   | ENABLE_LAST_SESSION_SUMMARY    | activo salvo `false` | worker continuidad último chat (#4+#47); tick `LAST_SESSION_SUMMARY_TICK_MS`; reencola `processing` viejos con `LAST_SESSION_SUMMARY_STALE_MS` (default 15 min); reintentos LLM `LAST_SESSION_SUMMARY_MAX_ATTEMPTS` (default 2, máx 5) |
 * | personalPatternRag         | PERSONAL_PATTERN_RAG_ENABLED   | off     | RAG patrones personales (#203); embeddings + consent Memoria del proceso |
 * | experientialPatterns       | EXPERIENTIAL_PATTERNS_ENABLED  | activo salvo `false` | API + persistencia memoria del proceso (#203/#211) |
 * | experientialFollowUp       | EXPERIENTIAL_FOLLOWUP_ENABLED  | activo salvo `false` | inyección follow-up evolutivo en chat |
 * | experientialExtract        | EXPERIENTIAL_EXTRACT_ENABLED   | activo salvo `false` | worker extracción al cierre de sesión |
 * | crisisHardStop             | ENABLE_CRISIS_HARD_STOP        | activo  | hard-stop sin LLM en HIGH + léxico explícito (#205) |
 * | softLandingPostCrisis      | ENABLE_SOFT_LANDING_POST_CRISIS | activo | soft landing 48 h post crisis (#225) |
 * | crisisRoutingSloMonitor    | ENABLE_CRISIS_ROUTING_SLO_MONITOR | activo | SLO camino A/B crisis (Mongo + Sentry) |
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
  /** Correos periódicos de recordatorio de contactos de emergencia (desactivado por defecto). */
  reminders: process.env.ENABLE_REMINDERS === 'true',
  crisisFollowUp: envIsNotFalse(process.env.ENABLE_CRISIS_FOLLOWUP),
  intenseChatCheckIn: envIsNotFalse(process.env.ENABLE_INTENSE_CHAT_CHECKIN),
  notificationScheduler: envIsNotFalse(process.env.ENABLE_NOTIFICATION_SCHEDULER),
  openaiDailyCostReport: envIsNotFalse(process.env.ENABLE_OPENAI_DAILY_COST_REPORT),
  trialRetentionEmail: envIsNotFalse(process.env.ENABLE_TRIAL_RETENTION_EMAIL),
  /** Recordatorio verificación email (~24 h tras registro). Default activo salvo `false`. */
  emailVerificationReminder: envIsNotFalse(process.env.ENABLE_EMAIL_VERIFICATION_REMINDER),
  /** Monitor SLO p95 de chat (Sentry + logs). Default: activo salvo 'false'. */
  chatLatencySloMonitor: envIsNotFalse(process.env.ENABLE_CHAT_LATENCY_SLO_MONITOR),
  /** Monitor SLO enrutamiento crisis (Mongo + Sentry). Default: activo salvo 'false'. */
  crisisRoutingSloMonitor: envIsNotFalse(process.env.ENABLE_CRISIS_ROUTING_SLO_MONITOR),
  /**
   * Correo semanal de aviso de resumen (plantilla neutra). Opt-in:
   * `ENABLE_WEEKLY_SUMMARY_EMAIL=true` o, por compatibilidad, `ENABLE_WEEKLY_TIPS_EMAIL=true`.
   */
  weeklySummaryEmail:
    process.env.ENABLE_WEEKLY_SUMMARY_EMAIL === 'true' ||
    process.env.ENABLE_WEEKLY_TIPS_EMAIL === 'true',
  swagger: resolveSwaggerEnabled(),
  /** Worker informe semanal de patrones (#208 / #217). Default activo salvo `false`. */
  weeklyPatternInsightWorker: envIsNotFalse(process.env.ENABLE_WEEKLY_PATTERN_INSIGHT),
  /** Narrativa LLM en informes (#208). Opt-in: `WEEKLY_INSIGHT_LLM_ENABLED=true` + OPENAI_API_KEY. */
  weeklyInsightLlm: process.env.WEEKLY_INSIGHT_LLM_ENABLED === 'true',
  /** Worker continuidad último chat (#4+#47). Default activo salvo `false`. */
  lastSessionSummaryWorker: envIsNotFalse(process.env.ENABLE_LAST_SESSION_SUMMARY),
  /** RAG patrones personales (#203). Opt-in: `PERSONAL_PATTERN_RAG_ENABLED=true` + embeddings + consent Memoria del proceso. */
  personalPatternRag: process.env.PERSONAL_PATTERN_RAG_ENABLED === 'true',
  /** API + persistencia memoria del proceso (#203/#211). Default activo salvo `false`. */
  experientialPatterns: envIsNotFalse(process.env.EXPERIENTIAL_PATTERNS_ENABLED),
  /** Follow-up evolutivo en chat. Default activo salvo `false`. */
  experientialFollowUp: envIsNotFalse(process.env.EXPERIENTIAL_FOLLOWUP_ENABLED),
  /** Worker extracción al cierre. Default activo salvo `false`. */
  experientialExtract: envIsNotFalse(process.env.EXPERIENTIAL_EXTRACT_ENABLED),
  /** Hard-stop crisis sin LLM (#205). Default activo salvo `ENABLE_CRISIS_HARD_STOP=false`. */
  crisisHardStop: envIsNotFalse(process.env.ENABLE_CRISIS_HARD_STOP),
  /** Soft landing 48 h post crisis (#225). Default activo salvo `ENABLE_SOFT_LANDING_POST_CRISIS=false`. */
  softLandingPostCrisis: envIsNotFalse(process.env.ENABLE_SOFT_LANDING_POST_CRISIS),
});

export default features;
