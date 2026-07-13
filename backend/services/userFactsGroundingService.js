/**
 * Servicio de grounding: extracción de hechos explícitos del usuario.
 * Solo incluye información que el usuario mencionó directamente en su historial.
 */

import Message from '../models/Message.js';
import { buildKnownFactsSnippet } from './chat/groundingPolicySnippet.js';

const FACT_CATEGORIES = {
  WORK: ['trabajo', 'laboral', 'empleo', 'jefe', 'colega', 'empresa', 'oficina', 'job', 'work', 'office', 'boss', 'colleague'],
  FAMILY: ['familia', 'madre', 'padre', 'hermano', 'hermana', 'hijo', 'hija', 'pareja', 'esposo', 'esposa', 'family', 'mother', 'father', 'sibling', 'child', 'partner', 'spouse'],
  STUDY: ['estudio', 'universidad', 'carrera', 'examen', 'profesor', 'study', 'university', 'exam', 'professor', 'school'],
  HEALTH: ['salud', 'médico', 'tratamiento', 'medicación', 'terapia', 'health', 'doctor', 'treatment', 'medication', 'therapy'],
  RELATIONSHIPS: ['amigo', 'amistad', 'relación', 'ex', 'friend', 'relationship', 'dating', 'breakup'],
};

/**
 * Patrones para extraer hechos biográficos explícitos del texto del usuario.
 * Solo capturan afirmaciones directas, no inferencias.
 */
const BIOGRAPHICAL_PATTERNS = [
  // Trabajo/profesión
  {
    pattern: /(?:trabajo|laboro)\s+(?:en|como|de)\s+([^.,;!?]{3,40})/i,
    category: 'work',
    template: (m, lang) => (lang === 'en' ? `Works as/in ${m[1].trim()}` : `Trabaja como/en ${m[1].trim()}`),
  },
  {
    pattern: /soy\s+([\w\s]{3,30})\s+(?:de profesión|profesional)/i,
    category: 'work',
    template: (m, lang) => (lang === 'en' ? `Is a ${m[1].trim()}` : `Es ${m[1].trim()}`),
  },
  {
    pattern: /i\s+work\s+(?:as|in)\s+([^.,;!?]{3,40})/i,
    category: 'work',
    template: (m, lang) => (lang === 'en' ? `Works as/in ${m[1].trim()}` : `Trabaja como/en ${m[1].trim()}`),
  },

  // Familia
  {
    pattern: /tengo\s+(\d+)\s+(hijo|hija|hermano|hermana)s?/i,
    category: 'family',
    template: (m, lang) =>
      lang === 'en' ? `Has ${m[1]} ${m[2] === 'hijo' || m[2] === 'hija' ? 'child' : 'sibling'}(s)` : `Tiene ${m[1]} ${m[2]}(s)`,
  },
  {
    pattern: /vivo\s+con\s+(?:mi|mis)\s+([\w\s]{3,30})/i,
    category: 'family',
    template: (m, lang) => (lang === 'en' ? `Lives with ${m[1].trim()}` : `Vive con ${m[1].trim()}`),
  },
  {
    pattern: /i\s+have\s+(\d+)\s+(child|children|sibling|siblings)/i,
    category: 'family',
    template: (m, lang) => (lang === 'en' ? `Has ${m[1]} ${m[2]}` : `Tiene ${m[1]} ${m[2] === 'child' || m[2] === 'children' ? 'hijo(s)' : 'hermano(s)'}`),
  },
  {
    pattern: /i\s+live\s+with\s+(?:my\s+)?([\w\s]{3,30})/i,
    category: 'family',
    template: (m, lang) => (lang === 'en' ? `Lives with ${m[1].trim()}` : `Vive con ${m[1].trim()}`),
  },

  // Estudio
  {
    pattern: /estudio\s+([^.,;!?]{3,40})/i,
    category: 'study',
    template: (m, lang) => (lang === 'en' ? `Studies ${m[1].trim()}` : `Estudia ${m[1].trim()}`),
  },
  {
    pattern: /i\s+(?:study|am\s+studying)\s+([^.,;!?]{3,40})/i,
    category: 'study',
    template: (m, lang) => (lang === 'en' ? `Studies ${m[1].trim()}` : `Estudia ${m[1].trim()}`),
  },

  // Compromisos/metas (solo afirmaciones muy explícitas)
  {
    pattern: /me\s+propuse\s+([^.,;!?]{5,50})/i,
    category: 'commitment',
    template: (m, lang) => (lang === 'en' ? `Committed to ${m[1].trim()}` : `Se propuso ${m[1].trim()}`),
  },
  {
    pattern: /voy\s+a\s+empezar\s+(?:a\s+)?([^.,;!?]{5,50})/i,
    category: 'commitment',
    template: (m, lang) => (lang === 'en' ? `Plans to start ${m[1].trim()}` : `Planea empezar ${m[1].trim()}`),
  },
  {
    pattern: /i\s+plan\s+to\s+([^.,;!?]{5,50})/i,
    category: 'commitment',
    template: (m, lang) => (lang === 'en' ? `Plans to ${m[1].trim()}` : `Planea ${m[1].trim()}`),
  },
];

/**
 * Extrae hechos conocidos del historial del usuario.
 * Solo incluye información explícita mencionada por el usuario.
 *
 * @param {string} userId - ID del usuario
 * @param {string} conversationId - ID de la conversación actual (opcional)
 * @param {number} limit - Máximo número de hechos a retornar
 * @returns {Promise<Array>} Lista de hechos estructurados
 */
export async function extractKnownFacts(userId, conversationId = null, limit = 10) {
  if (!userId) {
    console.warn('[userFactsGroundingService] userId is required');
    return [];
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const messages = await Message.find({
      userId,
      role: 'user',
      createdAt: { $gte: thirtyDaysAgo },
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .select('content createdAt metadata conversationId')
      .lean();

    if (!messages || messages.length === 0) return [];

    const facts = [];
    const seenFacts = new Set();

    for (const msg of messages) {
      const content = msg.content || '';
      if (content.length < 10) continue;

      const contentLower = content.toLowerCase();
      const msgLanguage = detectMessageLanguage(contentLower);

      for (const { pattern, category, template } of BIOGRAPHICAL_PATTERNS) {
        const match = content.match(pattern);
        if (match) {
          const fact = template(match, msgLanguage);
          const factKey = `${category}:${fact.toLowerCase()}`;

          if (!seenFacts.has(factKey) && isValidFact(fact)) {
            seenFacts.add(factKey);
            facts.push({
              fact,
              category,
              context: new Date(msg.createdAt).toLocaleDateString('es-ES'),
              conversationId: msg.conversationId,
              messageId: msg._id,
            });

            if (facts.length >= limit) break;
          }
        }
      }

      if (facts.length >= limit) break;
    }

    return facts.slice(0, limit);
  } catch (error) {
    console.error('[userFactsGroundingService] Error extracting facts:', error);
    return [];
  }
}

/**
 * Detecta el idioma del mensaje (es/en) para templates bilingües
 */
function detectMessageLanguage(contentLower) {
  const englishIndicators = ['i am', 'i have', 'i work', 'i study', 'my job', 'my family'];
  const spanishIndicators = ['soy', 'tengo', 'trabajo', 'estudio', 'mi trabajo', 'mi familia'];

  const englishScore = englishIndicators.filter((ind) => contentLower.includes(ind)).length;
  const spanishScore = spanishIndicators.filter((ind) => contentLower.includes(ind)).length;

  return englishScore > spanishScore ? 'en' : 'es';
}

/**
 * Valida que el hecho extraído sea útil y no contenga contenido problemático
 */
function isValidFact(fact) {
  if (!fact || fact.length < 5 || fact.length > 150) return false;

  const invalidPatterns = [
    /\b(suicid|muerte|morir|kill|die)\b/i,
    /\b(drogas?|alcohol|adicci[oó]n)\b/i,
  ];

  return !invalidPatterns.some((pattern) => pattern.test(fact));
}

/**
 * Construye el snippet completo de hechos conocidos para inyectar en el prompt.
 *
 * @param {string} userId - ID del usuario
 * @param {string} conversationId - ID de la conversación (opcional)
 * @param {string} language - Idioma del snippet ('es' | 'en')
 * @returns {Promise<string>} Snippet de hechos conocidos o string vacío
 */
export async function buildFactsSnippetForPrompt(userId, conversationId = null, language = 'es') {
  if (!userId) return '';

  const facts = await extractKnownFacts(userId, conversationId);

  if (facts.length === 0) return '';

  return buildKnownFactsSnippet(facts, language);
}
