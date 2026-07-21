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

/** Asuntos: promesa de continuidad primero; regalo visible en algunas rotaciones. */
const SUBJECT_BUILDERS = [
  () => `${APP_NAME} — no empiezas de cero`,
  () => `Lo que acordaste retomar ya vive en ${APP_NAME}`,
  () => `Un mensaje de ${APP_NAME}: continuidad a tu ritmo`,
  () => `${APP_NAME} 1.5.6 — foco, memoria y lo que quedó pendiente`,
  () => `Hola de nuevo desde ${APP_NAME}`,
  () => `${APP_NAME} — novedades de la versión 1.5.6`,
  () => {
    const plus = formatTrialGiftDaysPlus(getWeeklySummaryTrialGiftDays(), 'es');
    return `${APP_NAME} — lo que acordaste retomar (${plus} si aplica)`;
  },
  () => {
    const plus = formatTrialGiftDaysPlus(getWeeklySummaryTrialGiftDays(), 'es');
    return `Lo nuevo en ${APP_NAME} (+ posible ${plus} de prueba)`;
  },
  () => `${APP_NAME} te escribe — actualización 1.5.6`,
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
  () => {
    const count = formatTrialGiftDaysCount(getWeeklySummaryTrialGiftDays(), 'es');
    return `No empiezas de cero: foco, continuidad y memoria con tu control. Si aplica, ${count} de Premium.`;
  },
  (name) =>
    `Hace tiempo que no te escribíamos desde ${name}. Lo esencial de la 1.5.6, en pocas líneas.`,
  (name) =>
    `En ${name}, lo que acordaste retomar ya puede vivir en tu inicio — sin deberes ni prisa.`,
  (name) =>
    `Un saludo desde ${name}: continuidad entre conversaciones y un detalle si tu cuenta califica.`,
  (name) =>
    `Versión 1.5.6: eliges un foco, retomas con suavidad y recuerdas con permiso. A tu ritmo.`,
  (name) => {
    const count = formatTrialGiftDaysCount(getWeeklySummaryTrialGiftDays(), 'es');
    return `Novedades en ${name} y, si tu cuenta califica, ${count} extra de Premium.`;
  },
];

const LEAD_PARAGRAPH_VARIANTS = [
  (name) =>
    `Hace tiempo que no te escribíamos. La idea central de esta actualización: en ${name} no empiezas de cero — retomas lo que importa, a tu ritmo.`,
  (name) =>
    `Queríamos contarte algo simple. ${name} ahora te ayuda a elegir un foco, retomar lo acordado y recordar con tu permiso — sin presión ni evaluaciones.`,
  (name) =>
    `Gracias por seguir en ${name}. No hay nada urgente: solo queríamos acercarnos con lo esencial de la 1.5.6.`,
  (name) =>
    `Si ${name} quedó en pausa, no pasa nada. Cuando vuelvas, la app está pensada para retomar contigo — no para empezar de cero otra vez.`,
  (name) =>
    `Te escribimos con calma: menos lista de funciones, más una promesa clara. En ${name}, cada charla puede sumar continuidad cuando tú lo permites.`,
  (name) =>
    `Si llevas días sin abrir ${name}, también queríamos saludarte. Abajo: un detalle para tu cuenta y tres cambios que importan.`,
];

const WARM_BRIDGE_VARIANTS = [
  () => 'Primero un detalle para tu cuenta; después, lo esencial en tres líneas.',
  () => 'Lo ordenamos corto a propósito: para leerlo sin prisa.',
  () => 'Nada de esto caduca hoy. Tómate lo que necesites.',
];

const INVITE_LINE_VARIANTS = [
  (name) =>
    `Cuando quieras, abre ${name} y mira tu inicio: ahí pueden vivir el foco y lo que quedó para retomar.`,
  (name) =>
    `Si te viene bien ahora, un clic te lleva a ${name}. Si no, esto espera.`,
  (name) =>
    `Un clic y vuelves a ${name}. Sin prisa, sin juicios.`,
  (name) =>
    `Prueba lo nuevo cuando puedas: ${name} no te presiona.`,
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

  const updatesSectionTitle = 'Tres cambios que importan';
  const updatesIntro =
    'Versión 1.5.6. También hay chat más fluido y crisis con más cuidado; esto es lo que más cambia tu día a día:';

  const updatesLines = [...WEEKLY_PRODUCT_NEWS_LINES];

  const postUpdatesActionLine = isPremium
    ? ''
    : `Si en unos minutos no ves la prueba ampliada en Perfil, responde a este correo con el email de tu cuenta en ${APP_NAME}.`;

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
