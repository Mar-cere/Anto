/**
 * Contexto del correo de aviso de resumen semanal: impulso a abrir la app.
 * Puede incluir saludo con nombre; no se envían cifras ni métricas sensibles (crisis reportadas, etc.)
 * ni contenido de conversaciones: eso queda solo en la app, tras iniciar sesión.
 *
 * Tono: español neutro y natural (sin voseo ni marcas fuertemente regionales).
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
 * Índice 0..modulo-1 estable por semana ISO (sal distinta por bloque para que no coincidan todos los textos).
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

/**
 * Asuntos rotativos (etiqueta de semana ISO + marca; sin cifras ni métricas de uso).
 * Todos cierran con "en ${APP_NAME}" para mantener el mismo ritmo.
 */
const SUBJECT_BUILDERS = [
  (weekLabel) => `${weekLabel} — Tu resumen te espera en ${APP_NAME}`,
  (weekLabel) => `${weekLabel} — Un momento para revisar tu semana en ${APP_NAME}`,
  (weekLabel) => `${weekLabel} — Tu resumen semanal, en un clic, en ${APP_NAME}`,
  (weekLabel) => `${weekLabel} — Cierra la semana con calma en ${APP_NAME}`,
  (weekLabel) => `${weekLabel} — Mira tu semana cuando quieras en ${APP_NAME}`,
  (weekLabel) => `${weekLabel} — Tu semana, con perspectiva, en ${APP_NAME}`,
  (weekLabel) => `${weekLabel} — Novedades en la app y tu resumen en ${APP_NAME}`
];

/**
 * Índice estable por semana ISO (evita repetir siempre el mismo asunto).
 * @param {number} isoWeekYear
 * @param {number} isoWeek
 */
export function weeklyEmailSubjectIndex(isoWeekYear, isoWeek) {
  return weeklyContentVariantIndex(isoWeekYear, isoWeek, SUBJECT_BUILDERS.length, 0);
}

export function buildWeeklySummarySubjectLine(weekLabel, isoWeekYear, isoWeek) {
  const i = weeklyEmailSubjectIndex(isoWeekYear, isoWeek);
  return SUBJECT_BUILDERS[i](weekLabel);
}

/** Preheaders: tono invitación sin datos sensibles (longitud moderada para vista previa en móvil). */
const PREHEADER_VARIANTS = [
  (name) =>
    `Un minuto privado para mirar tu semana con calma en ${name}. El detalle completo está en la app, con tu sesión iniciada.`,
  (name) =>
    `Te invitamos a abrir ${name}: no hace falta una semana perfecta; mirar atrás con gentileza a veces cambia el día.`,
  (name) =>
    `Un clic y vuelves a tu espacio en ${name}. Sin juicios ni números en el correo: solo un recordatorio para retomar tu resumen.`,
  (name) =>
    `Si la semana fue intensa, ${name} ayuda a ordenar cabeza y corazón. Tu resumen semanal y mensual sigue ahí cuando puedas.`,
  (name) =>
    `Regalarte un respiro y revisar la semana también es autocuidado. En ${name} lo ves con privacidad, dentro de la app.`,
  (name) =>
    `¿Hace rato que no miras cómo vienes? ${name} ofrece una vista clara, sin apuro. Tú eliges cuándo entrar.`,
  (name) =>
    `Ecosistema nuevo en ${name}: tareas, hábitos y pomodoros desde el chat, tema claro y avisos más inteligentes. Mira tu resumen.`
];

/** Párrafos de apertura (invitación + perspectiva). */
const LEAD_PARAGRAPH_VARIANTS = [
  (name) =>
    `Esta semana te invitamos a frenar un instante y mirar tu proceso con más perspectiva: a veces, ver el recorrido completo ayuda a reconocer lo que estás sosteniendo y los pequeños avances que en el día a día pasan desapercibidos. Si hace días que no abres ${name}, también es un buen momento para reencontrarte, sin prisa ni culpas.`,
  (name) =>
    `Cerrar la semana no es solo tachar pendientes: es darte espacio para reconocer lo que viviste, lo que costó y lo que te sostuvo. En ${name} puedes hacerlo con una mirada más amplia y amable. Si el ritmo fue acelerado, un minuto con tu resumen puede cambiar el tono del descanso.`,
  (name) =>
    `No necesitas tener todo resuelto para volver a ${name}. A veces alcanza con mirar el resumen semanal con curiosidad en lugar de exigencia: ver el mapa ayuda a ubicarte y a elegir el próximo paso con menos peso.`,
  (name) =>
    `Te invitamos a un gesto simple: abrir ${name} y saludar a tu semana como quien saluda a un amigo cansado, con respeto. Ahí verás tu resumen pensado para ordenar sin sobrecargarte y para celebrar lo sutil que también cuenta.`,
  (name) =>
    `Si sientes que la semana se te fue de las manos, no estás sola ni solo: ${name} reúne en un solo lugar lo que registraste para que no tengas que cargar todo en la memoria. Retomar es un acto de cuidado, no de obligación.`,
  (name) =>
    `Una pausa breve puede alinear lo que sientes con lo que hiciste. En ${name}, el resumen semanal y mensual está para eso: para que la semana deje de ser solo ruido y pase a ser historia que puedes honrar.`,
  (name) =>
    `Quizá esta semana fue de avances silenciosos más que de grandes titulares. ${name} te ayuda a verlos: abre tu resumen cuando te animes, sin presión de rendimiento.`
];

const REFLECTION_PARAGRAPH_VARIANTS = [
  (name) =>
    `Dentro de ${name} encontrarás tu resumen semanal y mensual en una vista sencilla, pensada para que retomar sea fácil: ordenar lo importante sin sobrecarga, a tu ritmo, y seguir adelante con más claridad.`,
  (name) =>
    `Tu resumen en ${name} está armado para que no tengas que “ponerte al día” con esfuerzo: es una lectura guiada de tu semana y tu mes, con foco en lo que decidas cuidar.`,
  (name) =>
    `En ${name}, el resumen no es una nota al pie: es un espacio para reflexionar contigo con más contexto. Puedes entrar, mirar y salir; cada visita suma, sin agenda rígida.`,
  (name) =>
    `La vista de resumen en ${name} une lo que hiciste, lo que sentiste y lo que practicaste, para que no quede disperso. Así es más fácil decidir qué quieres sostener la semana que viene.`,
  (name) =>
    `Si prefieres ir despacio, ${name} te acompaña igual: el resumen semanal y mensual espera hasta que tengas un café y cinco minutos. No hay reloj corriendo ahí adentro.`,
  (name) =>
    `Además del chat, ${name} te ofrece esta mirada de conjunto para que lo cotidiano no se pierda. Es una invitación a confiar en el proceso, incluso cuando el día a día no alcanza para procesarlo todo.`
];

/** Dos líneas cada una: beneficios al abrir el resumen. */
const BENEFIT_BUNDLES = [
  [
    `Una lectura clara de tu actividad semanal y mensual dentro de ${APP_NAME}, para entender mejor cómo vienes.`,
    'Un espacio de acompañamiento para revisar tu proceso con calma, sin presión y con foco en lo que te hace bien.'
  ],
  [
    'Una foto de tu semana que no depende de la memoria ni del juicio del momento: datos agregados y humanos, sin exponer conversaciones en el correo.',
    `Señales de hábitos, emociones y técnicas en un solo lugar, para que en ${APP_NAME} elijas con más claridad qué priorizar.`
  ],
  [
    `Ver el arco de varios días seguidos en ${APP_NAME} suele mostrar patrones que el día a día esconde: es información para ti, no para compararte con nadie.`,
    'Un recordatorio amable de que lo que sumaste —aunque sea poco— también cuenta y merece ser visto.'
  ],
  [
    'Menos “¿cómo estaba la semana pasada?” y más “aquí está, ordenado”: eso reduce carga mental y abre espacio para descansar mejor.',
    `Desde el resumen puedes volver al chat o a tus registros en ${APP_NAME} con una intención más clara, sin empezar de cero cada vez.`
  ],
  [
    `Si estás en un momento delicado, el resumen en ${APP_NAME} te permite revisar con límites: tú decides cuánto mirar y cuándo parar.`,
    'Una forma de honrar tu proceso sin tener que explicarlo entero en voz alta si todavía no quieres.'
  ]
];

/**
 * Novedades recientes visibles en la app (actualizar este bloque cuando cambie el producto).
 * Redacción orientada a persona usuaria; sin métricas ni datos de la cuenta.
 */
const WEEKLY_PRODUCT_NEWS_LINES = [
  `Nuevo ecosistema conectado con el chat: puedes impulsar tareas, hábitos y pomodoros desde la conversación, sin perder el hilo de lo que te importa.`,
  `Tareas inteligentes: propuestas y seguimiento más alineados con lo que hablaste, para pasar del “qué podría hacer” al “qué voy a hacer”, con menos fricción.`,
  `Chat mejorado: continuidad más natural, respuestas más estables y recuperación cuando una respuesta se corta; al volver, un resumen breve de la última sesión ayuda a retomar.`,
  `Tema claro: nueva apariencia luminosa para quien prefiere pantallas claras y lectura cómoda de día.`,
  `Notificaciones inteligentes: avisos más pertinentes, menos ruido y límites diarios que cuidan tu atención sin dejarte fuera de lo importante.`,
  `Resumen semanal y mensual renovado: ves en conjunto cómo encajan chat, tareas, hábitos y foco, para entender tu semana con una sola mirada.`
];

const CLOSING_LINE_VARIANTS = [
  () =>
    `Gracias por ser parte de ${APP_NAME}. Te esperamos cuando quieras retomar: aquí seguimos, con ganas de verte de nuevo.`,
  () =>
    `Gracias por confiar en ${APP_NAME}. Si esta semana fue dura, ojalá el próximo resumen te devuelva un poco de aire. Estamos para acompañarte.`,
  () =>
    `Un abrazo digital desde el equipo de ${APP_NAME}. Que el descanso te encuentre, y que cuando vuelvas la app te reciba con la misma calma de siempre.`,
  () =>
    `Seguimos aquí, construyendo ${APP_NAME} con escucha. Cuando quieras mirar tu semana, abre la app: será un buen momento.`,
  () =>
    `Gracias por dedicarle tiempo a tu bienestar con ${APP_NAME}. No importa si fue poco o mucho: lo que importa es que sea tuyo.`,
  () =>
    `Te deseamos una buena transición de semana. ${APP_NAME} te espera sin prisa, con tu resumen listo cuando lo necesites.`
];

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
 *   updatesIntro: string,
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

  const preheaderText = PREHEADER_VARIANTS[weeklyContentVariantIndex(isoWeekYear, isoWeek, PREHEADER_VARIANTS.length, 1)](APP_NAME);

  const leadParagraph = LEAD_PARAGRAPH_VARIANTS[weeklyContentVariantIndex(isoWeekYear, isoWeek, LEAD_PARAGRAPH_VARIANTS.length, 2)](APP_NAME);

  const reflectionParagraph = REFLECTION_PARAGRAPH_VARIANTS[
    weeklyContentVariantIndex(isoWeekYear, isoWeek, REFLECTION_PARAGRAPH_VARIANTS.length, 3)
  ](APP_NAME);

  const privacyParagraph = `Para cuidar tu privacidad, este correo no incluye números sensibles ni contenido de tus conversaciones. La información detallada de tu resumen (hábitos, conversaciones, emociones, técnicas y otros registros) se muestra únicamente dentro de ${APP_NAME} cuando inicias sesión.`;

  const whereParagraph = `Desde aquí puedes abrir ${APP_NAME} directamente. Si el enlace no funciona en tu dispositivo, también encontrarás debajo la ruta para llegar al resumen manualmente.`;

  const benefitSectionTitle = 'Qué te espera al abrir tu resumen';
  const benefitLines = BENEFIT_BUNDLES[weeklyContentVariantIndex(isoWeekYear, isoWeek, BENEFIT_BUNDLES.length, 4)];

  const updatesSectionTitle = 'Novedades de la semana';
  const updatesIntro = `Hay un ecosistema nuevo alrededor del chat —tareas, hábitos y pomodoros—, tareas inteligentes, un chat más sólido, tema claro y notificaciones inteligentes. Abre ${APP_NAME} y comprueba cómo encaja todo con tu resumen.`;
  const updatesLines = [...WEEKLY_PRODUCT_NEWS_LINES];

  const downloadPrompt = `Si todavía no tienes la app instalada, puedes descargarla y empezar a usar ${APP_NAME} hoy mismo.`;

  const closingLine = CLOSING_LINE_VARIANTS[weeklyContentVariantIndex(isoWeekYear, isoWeek, CLOSING_LINE_VARIANTS.length, 6)]();

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
    updatesIntro,
    updatesLines,
    downloadPrompt,
    closingLine
  };
}
