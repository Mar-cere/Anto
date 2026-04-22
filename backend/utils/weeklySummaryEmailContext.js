/**
 * Contexto del correo de aviso de resumen semanal: impulso a abrir la app.
 * Puede incluir saludo con nombre; no se envían cifras ni métricas sensibles (crisis reportadas, etc.)
 * ni contenido de conversaciones: eso queda solo en la app, tras iniciar sesión.
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
 * Asuntos rotativos (etiqueta de semana ISO + marca; sin cifras ni métricas de uso).
 * Todos cierran con "en ${APP_NAME}" para mantener el mismo ritmo.
 */
const SUBJECT_BUILDERS = [
  (weekLabel) => `${weekLabel} — Tu resumen te espera en ${APP_NAME}`,
  (weekLabel) => `${weekLabel} — Un momento para revisar tu semana en ${APP_NAME}`,
  (weekLabel) => `${weekLabel} — Tu resumen semanal, en un clic, en ${APP_NAME}`,
  (weekLabel) => `${weekLabel} — Cierra la semana con calma en ${APP_NAME}`,
  (weekLabel) => `${weekLabel} — Mira tu semana cuando quieras en ${APP_NAME}`
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

  const preheaderText = `Solo un aviso con tu nombre: sin cifras ni métricas. El detalle del resumen (incluidas métricas sensibles) está en ${APP_NAME}, con la sesión iniciada.`;

  const leadParagraph = `Puedes dedicar un momento a revisar tu actividad en la app: la semana o el mes en un solo lugar, con claridad y sin prisa.`;

  const privacyParagraph = `Por discreción, en este correo no enviamos números ni el texto del chat. Métricas como la cantidad de crisis reportadas, hábitos, conversaciones, emociones, técnicas o el diario de gratitud solo se muestran en ${APP_NAME} cuando has iniciado sesión.`;

  const whereParagraph = `Abre ${APP_NAME}, entra en Perfil y elige «Resumen semanal y mensual». Allí seleccionas la semana o el mes; esa información solo está disponible para ti dentro de la aplicación.`;

  const benefitSectionTitle = 'Qué encontrarás al abrir el resumen';
  const benefitLines = [
    `Una vista de la semana o del mes: tu actividad en ${APP_NAME}, reunida en una pantalla.`,
    'Puedes cambiar entre resumen semanal y mensual cuando lo necesites.',
    'Es una herramienta para acompañarte, no para juzgarte: úsala al ritmo que te resulte cómodo.'
  ];

  const closingLine = `Gracias por confiar en nosotros. El equipo de ${APP_NAME}`;

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
