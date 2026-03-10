/**
 * Detector de estilo de escritura del usuario.
 * Inferir estilo (formal, coloquial, lacónico, emotivo) para adaptar el tono del asistente.
 * @see docs/MEJORAS_SERVICIOS_CHAT.md - Fase 3, punto 9
 *
 * Entrada: content, últimos N mensajes del usuario
 * Salida: style: 'formal' | 'casual' | 'laconic' | 'emotive'
 */
const PATRONES_FORMAL = [
  /\b(le agradecería|le ruego|quisiera solicitar|me permito|atentamente|cordiales saludos)\b/i,
  /\b(usted|ustedes|señor|señora|estimado)\b/i,
  /\b(por favor, podría|sería tan amable)\b/i,
  /\b(con respecto a|en referencia a|en cuanto a)\b/i,
  /\b(considero que|opino que|desde mi perspectiva)\b/i,
  /\b(no obstante|sin embargo|no obstante lo anterior)\b/i
];

const PATRONES_COLOQUIAL = [
  /\b(genial|chido|bacán|buenísimo|súper|re)\b/i,
  /\b(jeje|jaja|jajaja|xd|haha)\b/i,
  /\b(oye|mira|che|bueno|o sea|o sea que)\b/i,
  /\b(ta bien|dale|okey|tranqui|tranqui)\b/i,
  /\b(no pasa nada|ni idea|ni ahí)\b/i,
  /\b(me da igual|me da lo mismo)\b/i,
  /\b(está re|está súper|re bueno)\b/i
];

const PATRONES_LACONICO = [
  /^[^\s]{1,15}$/,  // Una sola palabra o frase muy corta
  /^(sí|no|ok|vale|bien|nada|gracias|hola|adiós)\s*[.!]?$/i,
  /^[^.]{1,25}$/     // Mensaje muy corto sin punto
];

const PATRONES_EMOTIVO = [
  /\b(muchísimo|demasiado|terrible|horrible|increíble|maravilloso)\b/i,
  /\b(!!!|!!|\?\!)\s*$/,
  /\b(😢|😭|😊|❤️|💔|😡|😰|🥺)/,
  /\b(no puedo más|me muero|me mata|me destroza)\b/i,
  /\b(amor|odio|adoro|detesto)\b/i,
  /\b(por favor por favor|ayuda ayuda)\b/i,
  /\b(realmente|sinceramente|honestamente)\s+(me siento|siento|estoy)\b/i
];

const UMBRAL_LACONICO_CHARS = 25;
const UMBRAL_EMOTIVO_EXCLAMACIONES = 2;
const MIN_MENSAJES_PARA_ANALISIS = 3;

/**
 * Detecta el estilo de escritura predominante del usuario.
 * @param {Object} params
 * @param {string} params.content - Contenido del mensaje actual
 * @param {Array} [params.userMessages] - Últimos mensajes del usuario (solo content)
 * @returns {{ style: 'formal' | 'casual' | 'laconic' | 'emotive', confidence: number }}
 */
function detectWritingStyle({ content, userMessages = [] }) {
  const texts = [content, ...(userMessages || []).map(m => (typeof m === 'string' ? m : m?.content || '')).filter(Boolean)];
  const combined = texts.join(' ');
  if (!combined.trim()) return { style: 'casual', confidence: 0 };

  let formalScore = 0;
  let casualScore = 0;
  let laconicScore = 0;
  let emotiveScore = 0;

  for (const text of texts) {
    if (!text || text.length < 3) continue;

    // Formal
    if (PATRONES_FORMAL.some(p => p.test(text))) formalScore += 2;
    if (/\.$/.test(text) && text.split(/[.!?]/).length >= 2 && text.length > 80) formalScore += 0.5;

    // Casual
    if (PATRONES_COLOQUIAL.some(p => p.test(text))) casualScore += 2;
    if (text.includes('?') && text.length < 60) casualScore += 0.5;

    // Laconic
    if (PATRONES_LACONICO.some(p => p.test(text.trim()))) laconicScore += 2;
    if (text.length <= UMBRAL_LACONICO_CHARS) laconicScore += 1;

    // Emotive
    if (PATRONES_EMOTIVO.some(p => p.test(text))) emotiveScore += 2;
    const exclamations = (text.match(/!+/g) || []).length;
    if (exclamations >= UMBRAL_EMOTIVO_EXCLAMACIONES) emotiveScore += 1;
    if (/\p{Emoji}/u.test(text)) emotiveScore += 1;
  }

  const scores = [
    { style: 'formal', score: formalScore },
    { style: 'casual', score: casualScore },
    { style: 'laconic', score: laconicScore },
    { style: 'emotive', score: emotiveScore }
  ];
  scores.sort((a, b) => b.score - a.score);

  const top = scores[0];
  const second = scores[1];
  const confidence = texts.length >= MIN_MENSAJES_PARA_ANALISIS
    ? Math.min(0.9, 0.5 + (top.score - (second?.score || 0)) * 0.15)
    : Math.min(0.7, 0.4 + top.score * 0.1);

  return {
    style: top.score > 0 ? top.style : 'casual',
    confidence
  };
}

const writingStyleDetector = {
  detectWritingStyle
};

export default writingStyleDetector;
