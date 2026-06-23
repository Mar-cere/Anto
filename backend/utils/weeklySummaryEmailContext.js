/**
 * Contexto del correo de aviso / campaña: tono humano primero, novedades después, resumen al final.
 * No incluye cifras sensibles ni contenido de conversaciones en el cuerpo del correo.
 *
 * Tono: español neutro y natural (tú estándar; sin voseo).
 */
import { APP_NAME } from '../constants/app.js';
import { WEEKLY_PRODUCT_NEWS_LINES_ES } from '../constants/weeklyProductNews.js';
import {
  buildWeeklySummaryGiftCopy,
  formatTrialGiftDaysCount,
  formatTrialGiftDaysPlus,
  getWeeklySummaryTrialGiftDays,
} from '../constants/subscription.js';
import { buildWeeklySummaryEmailContextEn } from './weeklySummaryEmailContext.en.js';
import { normalizeEmailLanguage } from './emailLanguage.js';

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
 * @param {number} isoWeekYear
 * @param {number} isoWeek
 * @param {number} modulo
 * @param {number} [salt=0]
 */
export function weeklyContentVariantIndex(isoWeekYear, isoWeek, modulo, salt = 0) {
  if (!Number.isFinite(modulo) || modulo <= 0) return 0;
  const n = isoWeekYear * 53 + isoWeek + salt * 17;
  return ((n % modulo) + modulo) % modulo;
}

/** Asuntos: humanos primero; el resumen no lidera. */
const SUBJECT_BUILDERS = [
  () => `${APP_NAME} — queríamos contarte las novedades`,
  () => `Lo nuevo en ${APP_NAME}, sin prisa`,
  () => `Un mensaje de ${APP_NAME} para ti`,
  () => `${APP_NAME} mejoró: te contamos qué cambió`,
  () => `Hola de nuevo desde ${APP_NAME}`,
  () => `${APP_NAME} — novedades de la versión 1.5.0`,
  () => {
    const plus = formatTrialGiftDaysPlus(getWeeklySummaryTrialGiftDays(), 'es');
    return `${APP_NAME} — novedades y, si aplica a tu cuenta, ${plus} de prueba`;
  },
  () => {
    const plus = formatTrialGiftDaysPlus(getWeeklySummaryTrialGiftDays(), 'es');
    return `Lo nuevo en ${APP_NAME} (+ posible ${plus} de prueba)`;
  },
  () => `${APP_NAME} te escribe — actualización 1.5.0`,
  () => `Gracias por seguir aquí — novedades en ${APP_NAME}`,
];

export function weeklyEmailSubjectIndex(isoWeekYear, isoWeek) {
  return weeklyContentVariantIndex(isoWeekYear, isoWeek, SUBJECT_BUILDERS.length, 0);
}

export function getWeeklySummarySubjectVariantCount() {
  return SUBJECT_BUILDERS.length;
}

export function buildWeeklySummarySubjectLine(_weekLabel, isoWeekYear, isoWeek) {
  const i = weeklyEmailSubjectIndex(isoWeekYear, isoWeek);
  return SUBJECT_BUILDERS[i]();
}

const PREHEADER_VARIANTS = [
  () =>
    'Te escribimos con calma: novedades de la app y un detalle especial si aplica a tu cuenta. Sin prisa.',
  (name) =>
    `Un saludo desde ${name}. A continuación, lo que mejoramos; el resto lo ves en la app cuando quieras.`,
  (name) =>
    `No es un recordatorio de tareas ni un informe: solo queríamos saludarte y contarte lo nuevo en ${name}.`,
  (name) =>
    `Si hace días que no abres ${name}, también queríamos acercarnos. Aquí tienes las novedades.`,
  (name) =>
    `Versión 1.5.0 con mejoras en el chat y en la experiencia. Lo demás, a tu ritmo.`,
  (name) => {
    const count = formatTrialGiftDaysCount(getWeeklySummaryTrialGiftDays(), 'es');
    return `Novedades en ${name} y, si aplica a tu cuenta, ${count} extra de prueba Premium.`;
  },
];

const LEAD_PARAGRAPH_VARIANTS = [
  (name) =>
    `Queríamos escribirte con calma. No hace falta que hayas tenido una semana perfecta: ${name} sigue aquí cuando te venga bien retomar.`,
  (name) =>
    `Hace unos días pensamos en quienes usan ${name} a distintos ritmos. Este correo es un saludo y un repaso de lo que hemos mejorado — nada más.`,
  (name) =>
    `Gracias por seguir confiando en ${name}. No te pedimos nada urgente; solo queríamos acercarnos y contarte las novedades.`,
  (name) =>
    `A veces la vida va acelerada y ${name} queda en pausa. Si te pasa, no pasa nada. Puedes volver cuando quieras; ${name} sigue ahí para ti.`,
  (name) =>
    `Te escribimos como quien manda un mensaje a un conocido: con respeto, sin presión y con ganas de que ${name} te siga sirviendo.`,
  (name) =>
    `Si llevas tiempo sin abrir ${name}, también queríamos saludarte. Más abajo está lo más importante de esta actualización.`,
];

const WARM_BRIDGE_VARIANTS = [
  () => 'Tómate lo que necesites para leerlo; nada de esto caduca hoy.',
  () => 'Resumimos lo esencial para que no tengas que buscarlo tú.',
  () => 'Lo ordenamos por temas para que puedas leer lo esencial con rapidez.',
];

const INVITE_LINE_VARIANTS = [
  (name) =>
    `Cuando quieras, abre ${name} y mira con calma. Estaremos ahí.`,
  (name) =>
    `Si te viene bien ahora, puedes abrir ${name} con un clic. Si no, guardamos esto para cuando quieras.`,
  (name) =>
    `Un clic y vuelves a ${name}. Sin prisa, sin juicios.`,
  (name) =>
    `Prueba las novedades cuando puedas: ${name} no te presiona.`,
];

const REFLECTION_PARAGRAPH_VARIANTS = [
  (name) =>
    `Además del chat, en ${name} tienes un resumen semanal y mensual para mirar atrás con perspectiva — solo si quieres, sin obligación.`,
  (name) =>
    `Si en algún momento quieres ordenar la semana, en ${name} hay una vista de resumen pensada para eso: entras, miras y sales a tu ritmo.`,
  (name) =>
    `Por si te sirve más adelante: en Perfil puedes ver un resumen de tu actividad en ${name}, siempre dentro de la app y con tu sesión iniciada.`,
  (name) =>
    `El resumen en ${name} no es una nota al pie: es un espacio opcional para reflexionar contigo, cuando tengas un café y cinco minutos.`,
];

const BENEFIT_BUNDLES = [
  [
    `Una lectura clara de tu semana y de tu mes, solo dentro de ${APP_NAME}.`,
    'Un lugar para revisar tu proceso con calma, sin presión.',
  ],
  [
    'Lo que registraste, ordenado en un solo lugar — sin exponer conversaciones en el correo.',
    `Señales de hábitos, emociones y técnicas para decidir qué cuidar en ${APP_NAME}.`,
  ],
  [
    `Patrones que el día a día esconde, visibles cuando miras varios días seguidos en ${APP_NAME}.`,
    'Un recordatorio de que lo pequeño que sumaste también cuenta.',
  ],
  [
    'Menos carga mental: la semana queda escrita, no solo en la memoria.',
    `Desde el resumen puedes volver al chat en ${APP_NAME} con más claridad.`,
  ],
  [
    `Revisar con límites: tú eliges cuánto mirar y cuándo parar en ${APP_NAME}.`,
    'Valorar tu proceso sin tener que explicarlo entero si no quieres.',
  ],
];

const WEEKLY_PRODUCT_NEWS_LINES = [...WEEKLY_PRODUCT_NEWS_LINES_ES];

const CLOSING_LINE_VARIANTS = [
  () =>
    `Gracias por ser parte de ${APP_NAME}. Te recibimos con cariño cuando quieras volver.`,
  () =>
    `Un abrazo desde el equipo de ${APP_NAME}. Que la semana te trate con gentileza.`,
  () =>
    `Seguimos aquí, mejorando ${APP_NAME} paso a paso. Cuando quieras, abre la app.`,
  () =>
    `Gracias por confiar en ${APP_NAME}. Sin prisa: a tu ritmo siempre.`,
  () =>
    `Te deseamos una buena semana. ${APP_NAME} te espera cuando lo necesites.`,
];

export function buildWeeklySummaryEmailContext(user, isoParts, language = 'es') {
  if (normalizeEmailLanguage(language) === 'en') {
    return buildWeeklySummaryEmailContextEn(user, isoParts);
  }

  const rawName = user?.name && String(user.name).trim();
  const rawUser = user?.username && String(user.username).trim();
  const displayName = escapeHtmlText(rawName || rawUser || '');

  const { isoWeekYear, isoWeek } = isoParts;
  const weekLabel = `Semana ${isoWeek} · ${isoWeekYear}`;
  const subjectLine = buildWeeklySummarySubjectLine(weekLabel, isoWeekYear, isoWeek);

  const preheaderText = PREHEADER_VARIANTS[
    weeklyContentVariantIndex(isoWeekYear, isoWeek, PREHEADER_VARIANTS.length, 1)
  ](APP_NAME);

  const leadParagraph = LEAD_PARAGRAPH_VARIANTS[
    weeklyContentVariantIndex(isoWeekYear, isoWeek, LEAD_PARAGRAPH_VARIANTS.length, 2)
  ](APP_NAME);

  const warmBridgeLine = WARM_BRIDGE_VARIANTS[
    weeklyContentVariantIndex(isoWeekYear, isoWeek, WARM_BRIDGE_VARIANTS.length, 5)
  ]();

  const inviteLine = INVITE_LINE_VARIANTS[
    weeklyContentVariantIndex(isoWeekYear, isoWeek, INVITE_LINE_VARIANTS.length, 6)
  ](APP_NAME);

  const reflectionParagraph = REFLECTION_PARAGRAPH_VARIANTS[
    weeklyContentVariantIndex(isoWeekYear, isoWeek, REFLECTION_PARAGRAPH_VARIANTS.length, 3)
  ](APP_NAME);

  const privacyParagraph = `Este correo no incluye cifras sensibles ni contenido de tus conversaciones. Los detalles (hábitos, emociones, técnicas y registros) se ven solo en ${APP_NAME} cuando inicias sesión.`;

  const whereParagraph = `Puedes abrir ${APP_NAME} desde el botón de arriba. Si el enlace no funciona en tu dispositivo, abre la app manualmente con tu cuenta.`;

  const benefitSectionTitle = 'Si quieres mirar atrás más adelante';
  const benefitLines = BENEFIT_BUNDLES[
    weeklyContentVariantIndex(isoWeekYear, isoWeek, BENEFIT_BUNDLES.length, 4)
  ];

  const rawSubStatus = user?.subscription?.status;
  const subStatus = typeof rawSubStatus === 'string' ? rawSubStatus.trim() : '';
  const isPremium = subStatus === 'premium';

  const giftDays = getWeeklySummaryTrialGiftDays();
  const {
    giftBadgeLabel,
    giftTitle,
    giftPrimary,
    giftSecondary,
  } = buildWeeklySummaryGiftCopy({
    giftDays,
    isPremium,
    appName: APP_NAME,
    locale: 'es',
  });

  const updatesSectionTitle = 'Lo que hemos mejorado';
  const updatesIntro =
    'En la versión 1.5.0 mejoramos, sobre todo, el chat en momentos difíciles y algunos detalles de la experiencia. Esto es lo más visible:';

  const updatesLines = [...WEEKLY_PRODUCT_NEWS_LINES];

  const postUpdatesActionLine = `Si ya usas la app, revisa en Perfil si tu prueba se amplió. Si crees que debería aplicarse y no lo ves, responde a este correo con la dirección con la que inicias sesión en ${APP_NAME}.`;

  const downloadPrompt = `Si aún no tienes la app, puedes descargarla e instalarla cuando quieras.`;

  const closingLine = CLOSING_LINE_VARIANTS[
    weeklyContentVariantIndex(isoWeekYear, isoWeek, CLOSING_LINE_VARIANTS.length, 7)
  ]();

  /** @deprecated Mantener por compatibilidad con tests/scripts antiguos */
  const openingBenefitLine = warmBridgeLine;

  return {
    displayName,
    weekLabel,
    subjectLine,
    preheaderText,
    leadParagraph,
    warmBridgeLine,
    inviteLine,
    openingBenefitLine,
    reflectionParagraph,
    privacyParagraph,
    whereParagraph,
    benefitSectionTitle,
    benefitLines,
    giftBadgeLabel,
    giftTitle,
    giftPrimary,
    giftSecondary,
    updatesSectionTitle,
    updatesIntro,
    updatesLines,
    postUpdatesActionLine,
    downloadPrompt,
    closingLine,
  };
}
