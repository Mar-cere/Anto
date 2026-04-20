/**
 * Programación del correo de aviso de resumen semanal (UTC).
 * La deduplicación real es por usuario en BD (`stats.lastWeeklyTipsEmailYearWeek`).
 *
 * Horario por defecto (elige uno con `WEEKLY_TIPS_EMAIL_SLOT`):
 * - `sunday_morning`: domingo ~mañana UTC (10:00, ventana 0–45 min).
 * - `saturday_night`: sábado ~noche UTC (23:00, ventana 0–59 min).
 *
 * Cualquier `WEEKLY_TIPS_EMAIL_UTC_*` definida en el entorno **pisa** el preset del slot.
 */
import { features } from '../config/features.js';
import config from '../config/config.js';
import logger from '../utils/logger.js';

/** @type {Record<string, Record<string, string>>} */
const WEEKLY_TIPS_SLOT_PRESETS = {
  sunday_morning: {
    WEEKLY_TIPS_EMAIL_UTC_WEEKDAY: '0',
    WEEKLY_TIPS_EMAIL_UTC_HOUR: '10',
    WEEKLY_TIPS_EMAIL_UTC_WINDOW_START_MINUTE: '0',
    WEEKLY_TIPS_EMAIL_UTC_WINDOW_END_MINUTE: '45',
  },
  saturday_night: {
    WEEKLY_TIPS_EMAIL_UTC_WEEKDAY: '6',
    WEEKLY_TIPS_EMAIL_UTC_HOUR: '23',
    WEEKLY_TIPS_EMAIL_UTC_WINDOW_START_MINUTE: '0',
    WEEKLY_TIPS_EMAIL_UTC_WINDOW_END_MINUTE: '59',
  },
};

/**
 * Combina preset del slot con variables de entorno (las explícitas ganan).
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {NodeJS.ProcessEnv}
 */
export function resolveWeeklyTipsMailEnv(env = process.env) {
  const raw = String(env.WEEKLY_TIPS_EMAIL_SLOT || 'sunday_morning')
    .toLowerCase()
    .trim()
    .replace(/-/g, '_');
  const preset = WEEKLY_TIPS_SLOT_PRESETS[raw] || WEEKLY_TIPS_SLOT_PRESETS.sunday_morning;
  const merged = { ...env };
  for (const [key, presetVal] of Object.entries(preset)) {
    const override = env[key];
    if (override !== undefined && override !== null && String(override).trim() !== '') {
      merged[key] = override;
    } else {
      merged[key] = presetVal;
    }
  }
  return merged;
}

function parseIntEnv(name, fallback, env = process.env) {
  const n = parseInt(env[name] ?? String(fallback), 10);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Ventana UTC configurable (sin flags de producto); útil para tests pasando `env` explícito.
 * @param {Date} [now]
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {boolean}
 */
export function matchesWeeklyTipsUtcWindow(now = new Date(), env = process.env) {
  const effective = resolveWeeklyTipsMailEnv(env);
  const targetDow = parseIntEnv('WEEKLY_TIPS_EMAIL_UTC_WEEKDAY', 0, effective);
  const targetHour = parseIntEnv('WEEKLY_TIPS_EMAIL_UTC_HOUR', 10, effective);
  const startMin = parseIntEnv('WEEKLY_TIPS_EMAIL_UTC_WINDOW_START_MINUTE', 0, effective);
  const endMin = parseIntEnv('WEEKLY_TIPS_EMAIL_UTC_WINDOW_END_MINUTE', 45, effective);

  if (now.getUTCDay() !== targetDow) {
    return false;
  }
  if (now.getUTCHours() !== targetHour) {
    return false;
  }
  const m = now.getUTCMinutes();
  if (m < startMin || m > endMin) {
    return false;
  }
  return true;
}

/**
 * Ventana UTC + flags (feature, entorno, NODE_ENV).
 * @param {Date} [now]
 * @returns {boolean}
 */
export function shouldRunWeeklyTipsJob(now = new Date()) {
  if (!features.weeklySummaryEmail) {
    return false;
  }
  if (process.env.NODE_ENV === 'test') {
    return false;
  }
  const allowNonProd = process.env.WEEKLY_TIPS_EMAIL_ALLOW_NON_PRODUCTION === 'true';
  if (config.app.environment !== 'production' && !allowNonProd) {
    return false;
  }

  return matchesWeeklyTipsUtcWindow(now, process.env);
}

/**
 * Inicia comprobación periódica (ligera) y ejecuta el lote cuando toca la ventana UTC.
 */
export function startWeeklyTipsEmailScheduler() {
  const tickMs = parseIntEnv('WEEKLY_TIPS_EMAIL_TICK_MS', 10 * 60 * 1000);

  setInterval(() => {
    void (async () => {
      try {
        if (!shouldRunWeeklyTipsJob()) {
          return;
        }
        const emailMarketingService = (await import('./emailMarketingService.js')).default;
        const slot = String(process.env.WEEKLY_TIPS_EMAIL_SLOT || 'sunday_morning').trim();
        logger.info(`📧 Ejecutando correo de resumen semanal (slot=${slot}, ventana UTC resuelta)...`);
        await emailMarketingService.sendWeeklySummaryEmails();
      } catch (error) {
        logger.error('❌ Error en job de tips semanales', { error: error.message });
      }
    })();
  }, tickMs);

  logger.info(
    `✅ Resumen semanal por correo: scheduler cada ${tickMs / 60000} min (UTC; ENABLE_WEEKLY_SUMMARY_EMAIL=true; WEEKLY_TIPS_EMAIL_SLOT=sunday_morning|saturday_night)`
  );
}
