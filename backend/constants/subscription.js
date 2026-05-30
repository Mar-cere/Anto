/**
 * Duración del trial de app (registro) y utilidades relacionadas.
 *
 * `APP_TRIAL_DAYS` — días de prueba al registrarse (default: 1).
 * `MERCADOPAGO_TRIAL_DAYS` — alias histórico; solo si `APP_TRIAL_DAYS` no está definida.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_HOUR = 60 * 60 * 1000;
const MAX_APP_TRIAL_DAYS = 90;

/**
 * @param {string | undefined} value
 * @param {number} fallback
 * @returns {number}
 */
function parseTrialDays(value, fallback) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) {
    return fallback;
  }
  return Math.min(n, MAX_APP_TRIAL_DAYS);
}

export const APP_TRIAL_DAYS = parseTrialDays(
  process.env.APP_TRIAL_DAYS ?? process.env.MERCADOPAGO_TRIAL_DAYS,
  1
);

export const APP_TRIAL_DURATION_MS = APP_TRIAL_DAYS * MS_PER_DAY;

/**
 * @param {Date} [fromDate]
 * @param {number} [days]
 * @returns {Date}
 */
export function addTrialDays(fromDate = new Date(), days = APP_TRIAL_DAYS) {
  return new Date(fromDate.getTime() + days * MS_PER_DAY);
}

/** Mitad del trial en horas (mín. 1 h) — default del correo de retención. */
export function getDefaultTrialRetentionAfterHours() {
  return Math.max(1, Math.floor((APP_TRIAL_DAYS * 24) / 2));
}

/** Trials cortos: duración nominal + 6 h de margen. */
export function getDefaultTrialRetentionMaxTrialHours() {
  return APP_TRIAL_DAYS * 24 + 6;
}

/**
 * Config expuesta al cliente (FAQ, registro).
 * @returns {{ trialDays: number, weeklySummaryTrialGiftDays: number }}
 */
export function getAppTrialPublicConfig() {
  return {
    trialDays: APP_TRIAL_DAYS,
    weeklySummaryTrialGiftDays: getWeeklySummaryTrialGiftDays(),
  };
}

/**
 * Días extra de trial tras el correo de resumen semanal (no premium).
 * Override: `WEEKLY_SUMMARY_TRIAL_GIFT_DAYS`. Con trial de 1 día el default es +1.
 */
export function getWeeklySummaryTrialGiftDays() {
  const raw = process.env.WEEKLY_SUMMARY_TRIAL_GIFT_DAYS;
  if (raw !== undefined && raw !== '') {
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }
  if (APP_TRIAL_DAYS <= 1) {
    return 1;
  }
  return Math.min(2, APP_TRIAL_DAYS);
}

/**
 * @param {number} days
 * @param {'es'|'en'|string} [locale]
 */
export function formatTrialGiftDaysPlus(days, locale = 'es') {
  const n = Number.isFinite(days) && days > 0 ? Math.floor(days) : 0;
  if (n <= 0) {
    return '';
  }
  if (locale === 'en') {
    return `+${n} day${n !== 1 ? 's' : ''}`;
  }
  return `+${n} día${n !== 1 ? 's' : ''}`;
}

/**
 * @param {number} days
 * @param {'es'|'en'|string} [locale]
 */
export function formatTrialGiftDaysCount(days, locale = 'es') {
  const n = Number.isFinite(days) && days > 0 ? Math.floor(days) : 0;
  if (n <= 0) {
    return '';
  }
  if (locale === 'en') {
    return `${n} day${n !== 1 ? 's' : ''}`;
  }
  return `${n} día${n !== 1 ? 's' : ''}`;
}

/**
 * Bloques de copy del regalo trial en el correo de resumen semanal.
 * @param {{ giftDays: number, isPremium: boolean, appName: string, locale?: string }}
 */
export function buildWeeklySummaryGiftCopy({ giftDays, isPremium, appName, locale = 'es' }) {
  const en = locale === 'en';
  const count = formatTrialGiftDaysCount(giftDays, locale);
  const plus = formatTrialGiftDaysPlus(giftDays, locale);

  if (isPremium) {
    return {
      giftBadgeLabel: en ? 'Your plan' : 'Tu plan',
      giftTitle: en ? 'Your Premium plan' : 'Tu plan Premium',
      giftPrimary: en
        ? `You have an active paid subscription: the extra ${count} trial gift does not change your plan or create charges. Thank you for staying with ${appName}.`
        : `Tienes suscripción de pago activa: el regalo de ${count} extra de prueba no modifica tu plan ni genera cargos. Gracias por seguir en ${appName}.`,
      giftSecondary: en
        ? 'Product updates are just below; open them in the app with your session signed in.'
        : 'Las novedades del producto van justo debajo; ábrelas en la app con tu sesión iniciada.',
    };
  }

  return {
    giftBadgeLabel: en ? 'Gift' : 'Regalo',
    giftTitle: en ? `Gift: ${plus} Premium trial` : `Regalo: ${plus} de prueba Premium`,
    giftPrimary: en
      ? `If your account qualifies, we add ${count} of Premium trial when this email is sent from our system. You do not need to click a link to “activate” it: it applies when the message is dispatched.`
      : `Si tu cuenta califica, sumamos ${count} de prueba Premium al procesar el envío de este correo desde nuestro sistema. No hace falta pulsar ningún enlace para “activarlo”: se aplica al despachar el mensaje.`,
    giftSecondary: en
      ? 'Check in the app (Profile or subscription) whether the extended trial is visible; stores sometimes take a few minutes to reflect it.'
      : 'Revisa en la app (Perfil o suscripción) si ya ves la prueba ampliada; a veces la tienda tarda unos minutos en reflejarlo.',
  };
}

/**
 * @param {Date|string|number} trialEndDate
 * @param {Date} [now]
 * @returns {{ daysRemaining: number, hoursRemaining: number }}
 */
export function computeTrialTimeRemaining(trialEndDate, now = new Date()) {
  const end = new Date(trialEndDate);
  const endMs = end.getTime();
  if (!Number.isFinite(endMs)) {
    return { daysRemaining: 0, hoursRemaining: 0 };
  }
  const msLeft = Math.max(0, endMs - now.getTime());
  const hoursRemaining = Math.ceil(msLeft / MS_PER_HOUR);
  const daysRemaining = Math.ceil(msLeft / MS_PER_DAY);
  return {
    daysRemaining: Math.max(0, daysRemaining),
    hoursRemaining: Math.max(0, hoursRemaining),
  };
}
