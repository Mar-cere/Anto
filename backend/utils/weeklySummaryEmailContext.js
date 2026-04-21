/**
 * Contexto del correo de aviso de resumen semanal: impulso a abrir la app.
 * Sin cifras de uso, chat, emociones ni conversaciones (eso queda solo en la app, con la sesión iniciada).
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

/** Asuntos rotativos (solo etiqueta de semana + marca; nada de métricas ni nombres). */
const SUBJECT_BUILDERS = [
  (weekLabel) => `${weekLabel} — Tu resumen te espera en ${APP_NAME}`,
  (weekLabel) => `${weekLabel} — Un momento para tu semana en ${APP_NAME}`,
  (weekLabel) => `${weekLabel} — Abre el resumen cuando quieras en ${APP_NAME}`,
  (weekLabel) => `${weekLabel} — Tu espacio de cierre de semana en ${APP_NAME}`,
  (weekLabel) => `${weekLabel} — Revisa tu semana con calma en ${APP_NAME}`
];

/**
 * Índice estable por semana ISO (evita repetir siempre el mismo asunto).
 * @param {number} isoWeekYear
 * @param {number} isoWeek
 */
export function weeklyEmailSubjectIndex(isoWeekYear, isoWeek) {
  return (isoWeekYear * 53 + isoWeek) % SUBJECT_BUILDERS.length;
}

export function buildWeeklySummarySubjectLine(weekLabel, isoWeekYear, isoWeek) {
  const i = weeklyEmailSubjectIndex(isoWeekYear, isoWeek);
  return SUBJECT_BUILDERS[i](weekLabel);
}

/**
 * @param {object} user — documento User (parcial) desde Mongo
 * @param {{ isoWeekYear: number, isoWeek: number, yearWeekKey: string }} isoParts
 * @returns {{
 *   displayName: string,
 *   weekLabel: string,
 *   subjectLine: string,
 *   preheaderText: string,
 *   leadParagraph: string,
 *   privacyParagraph: string,
 *   whereParagraph: string,
 *   benefitSectionTitle: string,
 *   benefitLines: string[],
 *   closingLine: string,
 * }}
 */
export function buildWeeklySummaryEmailContext(user, isoParts) {
  const rawName = user?.name && String(user.name).trim();
  const rawUser = user?.username && String(user.username).trim();
  const displayName = escapeHtmlText(rawName || rawUser || '');

  const { isoWeekYear, isoWeek } = isoParts;
  const weekLabel = `Semana ${isoWeek} · ${isoWeekYear}`;
  const subjectLine = buildWeeklySummarySubjectLine(weekLabel, isoWeekYear, isoWeek);

  const preheaderText = `Sin datos en este mensaje: el detalle está en ${APP_NAME}, con tu sesión iniciada.`;

  const leadParagraph = `Cada semana puedes hacer una pausa y ver cómo estuvo tu ritmo en la app: en un solo lugar, con claridad y sin prisa.`;
  const privacyParagraph = `Este correo no incluye cifras ni contenido de conversaciones. Lo relacionado con tu cuenta (hábitos, chat, emociones, técnicas, gratitud…) solo se muestra dentro de ${APP_NAME}, cuando inicias sesión.`;
  const whereParagraph = `Abre ${APP_NAME}, ve a Perfil y toca «Resumen semanal y mensual». Ahí eliges semana o mes; solo tú lo ves con tu sesión en la app.`;

  const benefitSectionTitle = 'Qué incluye el resumen (en la app)';
  const benefitLines = [
    'Una vista de tu semana o mes: tu actividad en la app en un solo lugar.',
    'Puedes alternar entre resumen semanal y mensual cuando lo necesites.',
    'Pensado para acompañarte, no para juzgar: puedes revisarlo con el ritmo que te convenga.'
  ];

  const closingLine = `Gracias por acompañarnos. — El equipo de ${APP_NAME}`;

  return {
    displayName,
    weekLabel,
    subjectLine,
    preheaderText,
    leadParagraph,
    privacyParagraph,
    whereParagraph,
    benefitSectionTitle,
    benefitLines,
    closingLine
  };
}
