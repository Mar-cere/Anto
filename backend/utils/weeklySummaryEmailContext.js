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
  (weekLabel) => `${weekLabel} — Mira tu semana cuando quieras en ${APP_NAME}`
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

/** Preheaders: tono invitación sin datos sensibles. */
const PREHEADER_VARIANTS = [
  (name) =>
    `Un recordatorio breve y privado para regalarte un minuto con ${name} y mirar tu semana con calma. Si hace un tiempo que no entrás, también es una buena excusa para retomar: todo el detalle te espera dentro de la app, con tu sesión iniciada.`,
  (name) =>
    `Te escribimos con cariño para invitarte a abrir ${name}: no hace falta que la semana haya sido perfecta; a veces mirar atrás con gentileza cambia cómo te sentís hoy.`,
  (name) =>
    `Un solo clic y volvés a tu espacio en ${name}. Este correo no trae juicios ni números: solo un empujón suave para que retomes tu resumen cuando te sea posible.`,
  (name) =>
    `Si la semana fue intensa, ${name} puede ayudarte a ordenar cabeza y corazón. Entrá cuando puedas: tu resumen semanal y mensual sigue esperándote.`,
  (name) =>
    `Pequeño recordatorio desde ${name}: regalarte un respiro y revisar tu semana también es autocuidado. Lo que importa está en la app, con tu privacidad respetada.`,
  (name) =>
    `¿Hace rato que no mirás cómo venís? ${name} te ofrece una vista clara de tu proceso, sin apuro. Este mensaje solo abre la puerta; vos elegís el momento.`
];

/** Párrafos de apertura (invitación + perspectiva). */
const LEAD_PARAGRAPH_VARIANTS = [
  (name) =>
    `Esta semana te invitamos a frenar un instante y mirar tu proceso con más perspectiva: a veces, ver el recorrido completo ayuda a reconocer lo que estás sosteniendo y los pequeños avances que en el día a día pasan desapercibidos. Si hace días que no abrís ${name}, también es un lindo momento para reencontrarte, sin prisa ni culpas.`,
  (name) =>
    `Cerrar la semana no es solo tachar pendientes: es darte espacio para reconocer lo que viviste, lo que costó y lo que te sostuvo. En ${name} podés hacerlo con una mirada más amplia y amable. Si el ritmo fue acelerado, un minuto con tu resumen puede cambiar el tono del descanso.`,
  (name) =>
    `No necesitás tener todo resuelto para volver a ${name}. A veces alcanza con mirar el resumen semanal con curiosidad en lugar de exigencia: ver el mapa ayuda a ubicarte y a elegir el próximo paso con menos peso.`,
  (name) =>
    `Te invitamos a un gesto simple: abrir ${name} y saludar a tu semana como quien saluda a un amigo cansado, con respeto. Ahí verás tu resumen pensado para ordenar sin sobrecargarte y para celebrar lo sutil que también cuenta.`,
  (name) =>
    `Si sentís que la semana se te fue de las manos, no estás sola ni solo: ${name} reúne en un solo lugar lo que registraste para que no tengas que cargar todo en la memoria. Retomar es un acto de cuidado, no de obligación.`,
  (name) =>
    `Una pausa breve puede alinear lo que sentís con lo que hiciste. En ${name}, el resumen semanal y mensual está para eso: para que la semana deje de ser solo ruido y pase a ser historia que podés honrar.`,
  (name) =>
    `Quizá esta semana fue de avances silenciosos más que de grandes titulares. ${name} te ayuda a verlos: abrí tu resumen cuando te animes, sin presión de rendimiento.`
];

const REFLECTION_PARAGRAPH_VARIANTS = [
  (name) =>
    `Dentro de ${name} encontrarás tu resumen semanal y mensual en una vista sencilla, pensada para que retomar sea fácil: ordenar lo importante sin sobrecarga, a tu ritmo, y seguir adelante con más claridad.`,
  (name) =>
    `Tu resumen en ${name} está armado para que no tengas que “ponerte al día” con esfuerzo: es una lectura guiada de tu semana y tu mes, con foco en lo que vos elegís cuidar.`,
  (name) =>
    `En ${name}, el resumen no es una nota al pie: es un lugar donde conversar con vos misma o vos mismo con más contexto. Podés entrar, mirar y salir; cada visita suma, sin agenda rígida.`,
  (name) =>
    `La vista de resumen en ${name} une lo que hiciste, lo que sentiste y lo que practicaste, para que no quede disperso. Así es más fácil decidir qué querés sostener la semana que viene.`,
  (name) =>
    `Si preferís ir despacio, ${name} te acompaña igual: el resumen semanal y mensual espera hasta que tengas un café y cinco minutos. No hay reloj corriendo ahí adentro.`,
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
    `Ver el arco de varios días seguidos en ${APP_NAME} suele mostrar patrones que el día a día esconde: es información para vos, no para compararte con nadie.`,
    'Un recordatorio amable de que lo que sumaste —aunque sea poco— también cuenta y merece ser visto.'
  ],
  [
    'Menos “¿cómo estaba la semana pasada?” y más “acá está, ordenado”: eso reduce carga mental y abre espacio para descansar mejor.',
    `Desde el resumen podés volver al chat o a tus registros en ${APP_NAME} con una intención más clara, sin empezar de cero cada vez.`
  ],
  [
    `Si estás en un momento delicado, el resumen en ${APP_NAME} te permite revisar con límites: vos decidís cuánto mirar y cuándo parar.`,
    'Una forma de honrar tu proceso sin tener que explicarlo entero en voz alta si todavía no querés.'
  ]
];

/** “Novedades” genéricas del producto; rotan para que el correo no se sienta siempre idéntico. */
const UPDATES_BUNDLES = [
  [
    `Renovamos cómo ves tu resumen semanal y mensual: más claro y humano, para que volver a mirar tu semana sea natural, aunque haya pasado unos días sin abrir la app. Este mismo correo solo te recuerda que estamos acá; lo importante siempre lo ves adentro, con tu privacidad cuidada.`,
    'En el chat la conversación se siente más fluida y cercana: menos interrupciones que te saquen del momento y más continuidad para acompañarte cuando lo necesitás.',
    'La app se siente más liviana en el día a día: menos ruido en los avisos y, cuando hace falta, más contención y claridad en los mensajes que te importan.',
    'Pequeños detalles en la pantalla para que retomar sea más fácil y agradable: porque volver a conectar con vos también es un gesto de autocuidado.'
  ],
  [
    'Seguimos puliendo la experiencia del resumen para que sea una conversación en silencio con vos: menos fricción, más sensación de “esto me representa”.',
    'Mejoras en cómo se muestran hábitos y rachas para que celebres lo sostenido sin convertirlo en una carrera.',
    'Ajustes de tono y ritmo en notificaciones: menos avisos genéricos y más señales útiles cuando realmente suman.',
    'El enlace de este correo te lleva directo a abrir la app: si algo falla, siempre podés ir a Perfil y abrir el resumen manualmente.'
  ],
  [
    'Trabajamos en que el resumen mensual dialogue mejor con el semanal: dos escalas para entender tu proceso sin mezclarlo todo en una sola pantalla.',
    'Refinamos textos y microcopys para que las explicaciones se sientan cercanas, no técnicas ni frías.',
    'En el chat priorizamos la continuidad del hilo emocional: menos saltos bruscos cuando retomás una conversación difícil.',
    'Cuidamos la privacidad de punta a punta: lo sensible no viaja por correo; lo ves solo dentro de la app autenticada.'
  ]
];

const CLOSING_LINE_VARIANTS = [
  () =>
    `Gracias por ser parte de ${APP_NAME}. Te esperamos cuando quieras retomar: acá seguimos, con ganas de verte de nuevo.`,
  () =>
    `Gracias por confiar en ${APP_NAME}. Si esta semana fue dura, ojalá el próximo resumen te devuelva un poco de aire. Estamos para acompañarte.`,
  () =>
    `Un abrazo digital desde el equipo de ${APP_NAME}. Que el descanso te encuentre, y que cuando vuelvas la app te reciba con la misma calma de siempre.`,
  () =>
    `Seguimos acá, construyendo ${APP_NAME} con escucha. Cuando quieras mirar tu semana, abrí la app: será un buen momento.`,
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
  const updatesLines = UPDATES_BUNDLES[weeklyContentVariantIndex(isoWeekYear, isoWeek, UPDATES_BUNDLES.length, 5)];

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
    updatesLines,
    downloadPrompt,
    closingLine
  };
}
