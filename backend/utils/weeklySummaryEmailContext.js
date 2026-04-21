/**
 * Contexto seguro para el correo de resumen semanal: cifras agregadas (sin texto de chat).
 */
import { APP_NAME } from '../constants/app.js';

/**
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtmlText(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {Date|string|undefined|null} date
 * @returns {string|null}
 */
export function formatLastActiveEs(date) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const diffMs = Date.now() - d.getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return 'actividad reciente: hoy';
  if (days === 1) return 'última actividad: ayer';
  if (days < 7) return `última actividad: hace ${days} días`;
  if (days < 30) return `última actividad: hace ${Math.floor(days / 7)} semanas`;
  return `última actividad: hace ${Math.floor(days / 30)} meses`;
}

/**
 * @param {Date|string|undefined|null} createdAt
 * @returns {string|null}
 */
export function formatTenureEs(createdAt) {
  if (!createdAt) return null;
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return null;
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days < 1) return `Empezaste con ${APP_NAME} recientemente.`;
  if (days === 1) return 'Llevas 1 día usando la app.';
  if (days < 7) return `Llevas ${days} días con nosotros.`;
  if (days < 30) return `Llevas ${Math.floor(days / 7)} semanas usando ${APP_NAME}.`;
  if (days < 365) return `Llevas ${Math.floor(days / 30)} meses con nosotros.`;
  return `Llevas más de un año acompañándonos.`;
}

/**
 * @param {string} status
 * @returns {string|null}
 */
export function formatSubscriptionLabelEs(status) {
  switch (status) {
    case 'premium':
      return 'Plan premium';
    case 'trial':
      return 'Período de prueba';
    case 'free':
      return 'Plan gratuito';
    case 'expired':
      return 'Suscripción no activa';
    default:
      return null;
  }
}

/**
 * @param {object} user — documento User (parcial) desde Mongo
 * @param {{ isoWeekYear: number, isoWeek: number, yearWeekKey: string }} isoParts
 * @returns {{
 *   displayName: string,
 *   weekLabel: string,
 *   subjectLine: string,
 *   snapshotIntro: string,
 *   snapshotLines: string[],
 *   planLine: string | null,
 *   tenureLine: string | null,
 *   lastActiveLine: string | null,
 * }}
 */
export function buildWeeklySummaryEmailContext(user, isoParts) {
  const rawName = user?.name && String(user.name).trim();
  const rawUser = user?.username && String(user.username).trim();
  const displayName = escapeHtmlText(rawName || rawUser || '');
  const stats = user?.stats || {};
  const tasks = Number(stats.tasksCompleted) || 0;
  const streak = Number(stats.habitsStreak) || 0;
  const logins = Number(stats.totalSessions) || 0;
  const sub = user?.subscription?.status || 'free';
  const planLine = formatSubscriptionLabelEs(sub);

  const { isoWeekYear, isoWeek } = isoParts;
  const weekLabel = `Semana ${isoWeek} · ${isoWeekYear}`;
  const subjectLine = `${weekLabel} — Tu resumen en ${APP_NAME}`;

  const snapshotLines = [];
  snapshotLines.push(`Tareas completadas (en total): ${tasks}.`);
  if (streak > 0) {
    snapshotLines.push(`Racha actual de hábitos: ${streak} día${streak === 1 ? '' : 's'}.`);
  }
  snapshotLines.push(`Inicios de sesión registrados en tu cuenta: ${logins}.`);

  const tenureLine = formatTenureEs(user?.createdAt);
  const lastActiveLine = formatLastActiveEs(stats.lastActive);

  return {
    displayName,
    weekLabel,
    subjectLine,
    snapshotIntro: `Así va tu camino con ${APP_NAME} (solo números; el detalle emocional está en la app):`,
    snapshotLines,
    planLine: planLine ? `Tu situación de cuenta: ${planLine}.` : null,
    tenureLine,
    lastActiveLine: lastActiveLine ? `${lastActiveLine.charAt(0).toUpperCase()}${lastActiveLine.slice(1)}.` : null,
  };
}
