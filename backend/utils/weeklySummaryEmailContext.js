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
 *   reflectionParagraph: string,
 *   privacyParagraph: string,
 *   whereParagraph: string,
 *   benefitSectionTitle: string,
 *   benefitLines: string[],
 *   updatesSectionTitle: string,
 *   updatesLines: string[],
 *   downloadPrompt: string,
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

  const preheaderText = `Te compartimos un recordatorio breve y privado para revisar tu semana en ${APP_NAME}. El detalle completo lo ves dentro de la app, con tu sesión iniciada.`;

  const leadParagraph = `Esta semana queremos invitarte a detenerte un momento y mirar tu proceso con más perspectiva. A veces, ver el recorrido completo ayuda a reconocer mejor lo que estás sosteniendo y los pequeños avances que, en el día a día, pueden pasar desapercibidos.`;

  const reflectionParagraph = `Dentro de ${APP_NAME} encontrarás tu resumen semanal y mensual en una vista simple, pensada para ayudarte a ordenar lo importante sin sobrecarga. La idea es que puedas volver a tu propio ritmo, revisar lo esencial y seguir avanzando con más claridad.`;

  const privacyParagraph = `Para cuidar tu privacidad, este correo no incluye números sensibles ni contenido de tus conversaciones. La información detallada de tu resumen (hábitos, conversaciones, emociones, técnicas y otros registros) se muestra únicamente dentro de ${APP_NAME} cuando inicias sesión.`;

  const whereParagraph = `Desde aquí puedes abrir ${APP_NAME} directamente. Si el enlace no funciona en tu dispositivo, también encontrarás debajo la ruta para llegar al resumen manualmente.`;

  const benefitSectionTitle = 'Qué encontrarás en tu resumen';
  const benefitLines = [
    `Una lectura clara de tu actividad semanal y mensual dentro de ${APP_NAME}, para entender mejor cómo vienes.`,
    'Un espacio de acompañamiento para revisar tu proceso con calma, sin presión y con foco en lo que te hace bien.'
  ];

  const updatesSectionTitle = 'Novedades de la app';
  const updatesLines = [
    'Mejoramos estabilidad y rendimiento para una experiencia más fluida en el día a día.',
    'Ajustamos el acceso al resumen semanal y mensual para que sea más simple y rápido.',
    `Seguimos optimizando ${APP_NAME} para ofrecerte interacciones más claras y consistentes.`
  ];

  const downloadPrompt = `Si todavía no tienes la app instalada, puedes descargarla y empezar a usar ${APP_NAME} hoy mismo.`;

  const closingLine = `Gracias por confiar en ${APP_NAME}. Estamos aquí para acompañarte.`;

  return {
    displayName,
    weekLabel,
    subjectLine,
    preheaderText,
    leadParagraph,
    reflectionParagraph,
    privacyParagraph,
    whereParagraph,
    benefitSectionTitle,
    benefitLines,
    updatesSectionTitle,
    updatesLines,
    downloadPrompt,
    closingLine
  };
}
